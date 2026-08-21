# CodeLock Judge

A Judge0-compatible execution service backed by Docker. Runs each submission in
a throwaway, network-less, read-only container and reports Judge0's status ids,
so `JUDGE0_URL` can point at this or at a real Judge0 with nothing else changing.

## Why this exists

Judge0 sandboxes with [`isolate`](https://github.com/ioi/isolate), which
requires **cgroup v1**. Docker Desktop (WSL2, macOS) and most modern distros
provide only cgroup v2, where every submission dies with:

```
Failed to create control group /sys/fs/cgroup/memory/box-N/: No such file or directory
```

Docker's own container isolation works fine on cgroup v2, so this reaches the
same goal through the runtime that is already installed.

## Isolation

| Flag | Stops |
|---|---|
| `--network none` | Phoning home, exfiltrating the problem set, attacking the LAN |
| `--memory` = `--memory-swap` | Memory bombs (OOM-killed instead of thrashing swap) |
| `--cpus 1` | One submission starving the others |
| `--pids-limit 128` | Fork bombs |
| `--read-only` + capped `tmpfs` | Any persistence between runs |
| `--cap-drop ALL` | Every Linux capability |
| `--security-opt no-new-privileges` | setuid escalation |
| `--user 65534:65534` | Running as root |
| source mounted `:ro` | Code rewriting itself mid-run |

Verified behaviours: network unreachable, `/etc` unwritable, `uid=65534`, the
container sees only its own source file, and a memory bomb is killed without
affecting the host.

## SECURITY

Two things to understand before running this on untrusted input:

**1. This is container isolation, not a microVM.** A kernel-level container
escape defeats it — as it would defeat Judge0. For a personal or small-team
deployment that is a reasonable trade. For public untrusted submissions, run it
on a dedicated host you can afford to lose, or use gVisor/Kata
(`--runtime=runsc`) for a second boundary.

**2. Access to the Docker socket is root-equivalent.** The service must reach a
Docker daemon to spawn sandboxes. Mounting `/var/run/docker.sock` into the judge
container means anyone who compromises the judge process controls the host.
Mitigate by running the judge on a dedicated VM, or put a socket proxy in front
that only permits `container create/start/wait/remove`.

Never expose this service to the public internet. It has no authentication by
design — it is meant to sit on a private network behind the CodeLock API.

## Running

```bash
npm run pull -w @codelock/judge     # pre-pull language images
npm run dev -w @codelock/judge
```

Pre-pulling matters: without it the first submission in a language pays the
image download inside the grading request, which looks exactly like a hung judge.

| Variable | Default | Meaning |
|---|---|---|
| `PORT` | `2358` | Judge0's conventional port |
| `JUDGE_CONCURRENCY` | `4` | Concurrent containers; each gets a full core |
| `DOCKER_BIN` | `docker` | Path to the Docker CLI |

## Timing

Elapsed time is measured **inside** the container, not around `docker run`.
Image start-up is 0.5–1s and varies more than the algorithmic difference the
speed gate exists to detect; timing from outside made an O(n) and an O(n²)
solution indistinguishable. Measured inside, the same pair reads 0.08s vs 0.42s.

Portability note: GNU `date +%s%N` gives nanoseconds, but busybox (Alpine)
ignores `%N`, so the probe falls back to `/proc/uptime` at centisecond
resolution.

## Adding a language

Add an entry to `src/languages.ts` with an image, a filename, and a shell
command. Compiled languages should build and run in one command so a compile
failure is distinguishable by exit code. Then re-run calibration — reference
runtimes are per language and per judge.
