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

if ($Status) {
  $pg = docker inspect $container --format '{{.State.Status}}' 2>$null
  Write-Host ("postgres  : {0}" -f $(if ($pg) { $pg } else { 'not found' }))
  foreach ($s in $services) {
    $proc = Get-PortProcess $s.Port
    Write-Host ("{0,-10}: {1}" -f $s.Name, $(if ($proc) { "listening on $($s.Port) (pid $($proc.Id))" } else { "down ($($s.Port) closed)" }))
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
while ((Get-Date) -lt $deadline) {
  docker info 2>&1 | Out-Null
  if ($LASTEXITCODE -eq 0) { $dockerUp = $true; break }
  Start-Sleep -Seconds 5
}

if (-not $dockerUp) {
  Write-Warning 'Docker did not become available. Postgres is down, so the API cannot serve.'
} else {
  $state = docker inspect $container --format '{{.State.Status}}' 2>$null
  if (-not $state) {
    Write-Warning "No container named $container. Create it with: docker compose --env-file apps/api/.env up -d postgres"
  } elseif ($state -ne 'running') {
    Write-Host "starting $container"
    docker start $container | Out-Null
  }
  # Accepting TCP is not the same as accepting queries; the API's boot-time
  # env check fails hard against a database still replaying WAL.
  $pgDeadline = (Get-Date).AddMinutes(2)
  while ((Get-Date) -lt $pgDeadline) {
    docker exec $container pg_isready -U codelock 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) { break }
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
foreach ($s in $services) {
  if (Test-Port $s.Port) {
    Write-Host ("  {0,-6} OK   :{1}" -f $s.Name, $s.Port)
  } else {
    Write-Warning ("  {0,-6} DOWN :{1} - see {2}" -f $s.Name, $s.Port, (Join-Path $logDir "$($s.Name).err.log"))
  }
}
