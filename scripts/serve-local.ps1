<#
.SYNOPSIS
  Start the CodeLock backend on this machine and leave it running.

.DESCRIPTION
  The desktop app is only half the product: the lock screen is served by the
  web app, problems and unlock tokens come from the API, and submissions are
  graded by the judge sandbox. A desktop app set to launch at login with no
  backend behind it is worse than not launching at all — the timer arms, the
  lock fires, and the unlock cannot be verified.

  So this brings up, in order:

    1. Postgres, as the `codelock-pg` container (its restart policy handles
       reboots; this covers the case where Docker came up after we did).
    2. The API on :4000.
    3. The web app on :3000.
    4. The judge sandbox on :2358.

  It runs the built output, not the dev servers — run `npm run build` first.
  Already-listening ports are left alone, so it is safe to run twice.

  This is the single-machine, single-user path. `deploy/` is what runs on a
  real server; nothing here is a substitute for it.

.PARAMETER Stop
  Stop the three Node services. Postgres is left running.

.PARAMETER Status
  Report what is listening and exit.

.EXAMPLE
  npm run build
  .\scripts\serve-local.ps1

.EXAMPLE
  .\scripts\serve-local.ps1 -Status
#>
[CmdletBinding()]
param(
  [switch]$Stop,
  [switch]$Status
)

$ErrorActionPreference = 'Stop'

$repo = Split-Path $PSScriptRoot -Parent
$logDir = Join-Path $env:LOCALAPPDATA 'CodeLock\logs'
$container = 'codelock-pg'

# Port is the identity here, not the process name: every one of these is
# "node", and the desktop app addresses them by port in config.json.
$services = @(
  @{ Name = 'api';   Port = 4000; Workspace = '@codelock/api' },
  @{ Name = 'web';   Port = 3000; Workspace = '@codelock/web' },
  @{ Name = 'judge'; Port = 2358; Workspace = '@codelock/judge' }
)

function Test-Port([int]$Port) {
  [bool](Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue)
}

function Get-PortProcess([int]$Port) {
  $conn = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
  if (-not $conn) { return $null }
  Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
}

<#
.SYNOPSIS
  Run a docker command without letting a missing daemon abort the script.

.DESCRIPTION
  $ErrorActionPreference = 'Stop' turns a native command's stderr into a
  terminating NativeCommandError, so a stopped Docker Desktop took -Status down
  with it — and the one moment you most want a status report is the one where
  something is already wrong.
#>
function Invoke-Docker {
  param([string[]]$DockerArgs)
  $previous = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  try {
    $out = & docker @DockerArgs 2>$null
    return @{ Output = ($out | Out-String).Trim(); ExitCode = $LASTEXITCODE }
  } catch {
    return @{ Output = ''; ExitCode = 1 }
  } finally {
    $ErrorActionPreference = $previous
  }
}

<#
.SYNOPSIS
  Report Docker's state as a cause, not a symptom.

.DESCRIPTION
  Postgres runs in a container and the judge sandboxes every submission in one,
  so a stopped Docker Desktop takes the database and grading with it. What that
  looked like from the outside was "api down" — true, useless, and pointing at
  the wrong thing. These states are reported by name so the first line of a
  failure names what to fix.
#>
function Get-DockerState {
  $daemon = Invoke-Docker @('info', '--format', '{{.ServerVersion}}')
  if ($daemon.ExitCode -ne 0) {
    $installed = @(
      (Join-Path $env:LOCALAPPDATA 'Programs\DockerDesktop\Docker Desktop.exe'),
      (Join-Path $env:ProgramFiles 'Docker\Docker\Docker Desktop.exe')
    ) | Where-Object { Test-Path $_ } | Select-Object -First 1
    if (-not $installed) { return 'not-installed' }
    return 'not-running'
  }
  $state = (Invoke-Docker @('inspect', $container, '--format', '{{.State.Status}}')).Output
  if (-not $state) { return 'no-container' }
  if ($state -ne 'running') { return "container-$state" }
  return 'running'
}

function Show-DockerLine([string]$state) {
  switch ($state) {
    'not-installed' { Write-Warning 'docker    : NOT INSTALLED - Postgres and the judge sandbox both need it.'; break }
    'not-running'   { Write-Warning 'docker    : NOT RUNNING - start Docker Desktop. Until then there is no database and no grading.'; break }
    'no-container'  { Write-Warning "docker    : running, but no '$container' container. Create it: docker compose --env-file apps/api/.env up -d postgres"; break }
    'running'       { Write-Host 'docker    : running'; break }
    default         { Write-Warning "docker    : running, but '$container' is $($state -replace '^container-','')." }
  }
}

if ($Status) {
  $docker = Get-DockerState
  Show-DockerLine $docker
  Write-Host ("postgres  : {0}" -f $(if ($docker -eq 'running') { 'running' } else { 'unavailable' }))
  foreach ($s in $services) {
    $proc = Get-PortProcess $s.Port
    Write-Host ("{0,-10}: {1}" -f $s.Name, $(if ($proc) { "listening on $($s.Port) (pid $($proc.Id))" } else { "down ($($s.Port) closed)" }))
  }
  # The API cannot serve without a database, so saying both are down twice is
  # two symptoms of one cause. Name the cause.
  if ($docker -ne 'running' -and -not (Test-Port 4000)) {
    Write-Host ''
    Write-Host 'The API is down because Docker is, not on its own. Fix Docker first.'
  }
  return
}

if ($Stop) {
  foreach ($s in $services) {
    $proc = Get-PortProcess $s.Port
    if ($proc) {
      Write-Host "stopping $($s.Name) (pid $($proc.Id))"
      Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
    }
  }
  Write-Host 'Postgres left running; stop it with: docker stop codelock-pg'
  return
}

New-Item -ItemType Directory -Path $logDir -Force | Out-Null

# --- Postgres -------------------------------------------------------------
# Docker Desktop starts at login but takes a while, and a logon-triggered run
# of this script can easily beat it there. Wait rather than fail.
$deadline = (Get-Date).AddMinutes(3)
$dockerUp = $false
$launchedDocker = $false

while ((Get-Date) -lt $deadline) {
  if ((Invoke-Docker @('info', '--format', '{{.ServerVersion}}')).ExitCode -eq 0) {
    $dockerUp = $true
    break
  }

  # Postgres lives in a container, so "start everything" has to include the
  # thing that runs containers. Docker Desktop normally starts at login, but it
  # can be quit like any other app — and then the database is simply gone, with
  # the API failing its boot-time env check rather than saying why. Launch it
  # once and keep waiting; it takes a while to expose the pipe.
  if (-not $launchedDocker) {
    $dockerExe = @(
      (Join-Path $env:LOCALAPPDATA 'Programs\DockerDesktop\Docker Desktop.exe'),
      (Join-Path $env:ProgramFiles 'Docker\Docker\Docker Desktop.exe')
    ) | Where-Object { Test-Path $_ } | Select-Object -First 1

    if ($dockerExe) {
      Write-Host 'starting Docker Desktop'
      Start-Process -FilePath $dockerExe -WindowStyle Hidden
      $launchedDocker = $true
    } else {
      Write-Warning 'Docker Desktop is not installed where expected; cannot start Postgres.'
      break
    }
  }

  Start-Sleep -Seconds 5
}

if (-not $dockerUp) {
  Write-Warning 'Docker did not become available. Postgres is down, so the API cannot serve.'
} else {
  $state = (Invoke-Docker @('inspect', $container, '--format', '{{.State.Status}}')).Output
  if (-not $state) {
    # Create it rather than printing a command for the user to copy. The
    # compose file already describes exactly this container, the credentials
    # come from apps/api/.env, and a first run that ends in "now go and type
    # this" is a first run that fails.
    Write-Host "no '$container' container; creating it from docker-compose.yml"
    $envFile = Join-Path $repo 'apps\api\.env'
    if (-not (Test-Path $envFile)) {
      Write-Warning "apps/api/.env is missing, so the database password is unknown. Cannot create the container."
    } else {
      $created = Invoke-Docker @('compose', '--env-file', $envFile, '-f', (Join-Path $repo 'docker-compose.yml'), 'up', '-d', 'postgres')
      if ($created.ExitCode -ne 0) {
        Write-Warning "could not create the container: $($created.Output)"
      } else {
        Write-Host "created and started $container"
        # The compose service is named 'postgres'; the container it produces is
        # what everything else refers to. Re-read rather than assume the name.
        $state = (Invoke-Docker @('inspect', $container, '--format', '{{.State.Status}}')).Output
      }
    }
  } elseif ($state -ne 'running') {
    Write-Host "starting $container"
    Invoke-Docker @('start', $container) | Out-Null
  }
  # Accepting TCP is not the same as accepting queries; the API's boot-time
  # env check fails hard against a database still replaying WAL.
  $pgDeadline = (Get-Date).AddMinutes(2)
  while ((Get-Date) -lt $pgDeadline) {
    if ((Invoke-Docker @('exec', $container, 'pg_isready', '-U', 'codelock')).ExitCode -eq 0) { break }
    Start-Sleep -Seconds 2
  }
}

# --- Node services --------------------------------------------------------
foreach ($s in $services) {
  if (Test-Port $s.Port) {
    Write-Host "$($s.Name) already listening on $($s.Port); leaving it alone"
    continue
  }

  $log = Join-Path $logDir "$($s.Name).log"
  $err = Join-Path $logDir "$($s.Name).err.log"
  Write-Host "starting $($s.Name) -> $($s.Port)  (log: $log)"

  # `next start` prints a warning about `output: 'standalone'` and then serves
  # the build anyway on Next 16. Running the standalone bundle directly instead
  # looks more correct and is not: from a checkout it starts, reports ready, and
  # 404s every route. The warning is noise; leave this alone.
  Start-Process -FilePath 'npm.cmd' `
    -ArgumentList @('run', 'start', '-w', $s.Workspace) `
    -WorkingDirectory $repo `
    -WindowStyle Hidden `
    -RedirectStandardOutput $log `
    -RedirectStandardError $err | Out-Null
}

# Report rather than assume. A service that dies on boot — a bad .env, a port
# taken by something else — should be visible here, not discovered later
# behind a lock screen that will not open.
Start-Sleep -Seconds 12
$anyDown = $false
foreach ($s in $services) {
  if (Test-Port $s.Port) {
    Write-Host ("  {0,-6} OK   :{1}" -f $s.Name, $s.Port)
  } else {
    $anyDown = $true
    Write-Warning ("  {0,-6} DOWN :{1} - see {2}" -f $s.Name, $s.Port, (Join-Path $logDir "$($s.Name).err.log"))
  }
}

# A service log full of Prisma connection errors is a symptom. If Docker never
# came up, that is the cause, and it belongs in the last line rather than
# somewhere in the middle of a stack trace.
$finalDocker = Get-DockerState
if ($anyDown -and $finalDocker -ne 'running') {
  Write-Host ''
  Show-DockerLine $finalDocker
  Write-Host 'That is why the services above are down. Nothing else needs fixing first.'
}

# Leave the verdict somewhere the desktop app can read it.
#
# The app spawns this script and then has no idea what happened — it can only
# see that the API is not answering, which is the symptom for every cause. A
# missing Docker install needs a very different message from a container that
# has not started yet, and the app cannot tell them apart by polling a port.
$status = [ordered]@{
  docker    = $finalDocker
  services  = [ordered]@{}
  checkedAt = (Get-Date).ToUniversalTime().ToString('o')
}
foreach ($s in $services) { $status.services[$s.Name] = [bool](Test-Port $s.Port) }
try {
  $status | ConvertTo-Json -Depth 4 |
    Out-File -FilePath (Join-Path $logDir 'backend-status.json') -Encoding utf8
} catch {
  # Reporting is a convenience; failing to report must not fail the startup.
}
