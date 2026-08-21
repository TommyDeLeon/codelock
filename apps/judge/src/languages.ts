/**
 * Language definitions.
 *
 * Ids match Judge0 1.13.1 so this service is a drop-in replacement: the API's
 * `JUDGE0_LANG_*` defaults work unchanged against either backend.
 *
 * Each language names a base image, the file to write, and the shell command to
 * run inside the container. Compiled languages build and run in one command so
 * a compile failure is distinguishable from a runtime failure by exit code.
 */

export interface LanguageSpec {
  id: number;
  name: string;
  image: string;
  filename: string;
  /** Runs inside the sandbox with the source at /work/<filename>. */
  command: string;
  /** True when a non-zero exit before execution means a compile error. */
  compiled: boolean;
}

export const LANGUAGES: Record<number, LanguageSpec> = {
  63: {
    id: 63,
    name: 'JavaScript (Node.js)',
    image: 'node:24-alpine',
    filename: 'main.js',
    command: 'node /work/main.js',
    compiled: false,
  },
  71: {
    id: 71,
    name: 'Python 3',
    image: 'python:3.13-alpine',
    filename: 'main.py',
    command: 'python3 /work/main.py',
    compiled: false,
  },
  62: {
    id: 62,
    name: 'Java (OpenJDK)',
    image: 'eclipse-temurin:21-jdk-alpine',
    filename: 'Main.java',
    // Single-file source mode: no separate javac step, and the JVM reports a
    // compile error as a non-zero exit before main() runs.
    command: 'java /work/Main.java',
    compiled: true,
  },
  54: {
    id: 54,
    name: 'C++ (GCC)',
    image: 'gcc:14',
    filename: 'main.cpp',
    // -O2 because the speed gate compares against an optimised reference; an
    // unoptimised build would look artificially slow.
    command: 'g++ -O2 -std=c++20 -o /tmp/a.out /work/main.cpp 2>/tmp/cc.log && /tmp/a.out',
    compiled: true,
  },
  60: {
    id: 60,
    name: 'Go',
    image: 'golang:1.23-alpine',
    // `go run` needs a writable cache; GOCACHE is pointed at the tmpfs.
    filename: 'main.go',
    command: 'GOCACHE=/tmp/gocache GOPATH=/tmp/go go run /work/main.go',
    compiled: true,
  },
};

/** Judge0 status ids, reproduced so clients need no translation layer. */
export const STATUS = {
  IN_QUEUE: { id: 1, description: 'In Queue' },
  PROCESSING: { id: 2, description: 'Processing' },
  ACCEPTED: { id: 3, description: 'Accepted' },
  WRONG_ANSWER: { id: 4, description: 'Wrong Answer' },
  TIME_LIMIT_EXCEEDED: { id: 5, description: 'Time Limit Exceeded' },
  COMPILATION_ERROR: { id: 6, description: 'Compilation Error' },
  RUNTIME_ERROR: { id: 11, description: 'Runtime Error (NZEC)' },
  INTERNAL_ERROR: { id: 13, description: 'Internal Error' },
  MEMORY_LIMIT_EXCEEDED: { id: 7, description: 'Memory Limit Exceeded' },
} as const;
