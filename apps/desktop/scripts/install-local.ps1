<#
.SYNOPSIS
  Install CodeLock on this machine without the NSIS installer.

.DESCRIPTION
  On a Windows 11 machine with Smart App Control enforcing, the generated NSIS
  installer is blocked at load: it appears to run, writes nothing, and leaves
  you with no program directory, no shortcut and no uninstall entry. The
  unpacked build is not blocked, and Smart App Control's verdict follows the
  binary rather than its path — a copy of `win-unpacked` runs from anywhere.

  So this does by hand the three things the installer would have done: put the
  app somewhere stable, give it a Start Menu shortcut, and let it register its
  own login item from that stable path. The app then behaves as designed —
  tray icon, window closes without quitting, timer still armed.

  It is not a substitute for a signed installer when shipping to other people.
  It is the local path for a machine you own. See docs/TRUSTED-INSTALL.md.

.PARAMETER Source
  The unpacked build to install. Defaults to the x64 output of `npm run dist`.

.PARAMETER Destination
  Where to install. Defaults to the same per-user location NSIS would target.

.PARAMETER NoStart
  Copy and create the shortcut, but do not launch. Without a launch the app
  never registers its login item, so it will not start in the background.

.EXAMPLE
  npx electron-builder --win nsis --x64 --arm64 -c.win.signAndEditExecutable=false --publish never
  .\apps\desktop\scripts\install-local.ps1
#>
[CmdletBinding()]
param(
  [string]$Source = (Join-Path $PSScriptRoot '..\release\win-unpacked'),
  [string]$Destination = (Join-Path $env:LOCALAPPDATA 'Programs\CodeLock'),
  [switch]$NoStart
)

$ErrorActionPreference = 'Stop'

$Source = (Resolve-Path $Source).Path
$exeName = 'CodeLock.exe'
if (-not (Test-Path (Join-Path $Source $exeName))) {
  throw "No $exeName in $Source. Run the electron-builder command in the examples first."
}

# A running copy holds a lock on its own files, and on the login item it is
# about to rewrite. Stop it before touching either.
Get-Process -Name 'CodeLock' -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

Write-Host "Installing to $Destination"
if (Test-Path $Destination) {
  # Replace rather than merge: a stale file from an older build inside an
  # otherwise-new install is the kind of thing that takes a day to find.
  Remove-Item $Destination -Recurse -Force
}
New-Item -ItemType Directory -Path $Destination -Force | Out-Null
Copy-Item (Join-Path $Source '*') $Destination -Recurse -Force

$target = Join-Path $Destination $exeName

$startMenu = Join-Path $env:APPDATA 'Microsoft\Windows\Start Menu\Programs'
$shortcut = Join-Path $startMenu 'CodeLock.lnk'
$shell = New-Object -ComObject WScript.Shell
$link = $shell.CreateShortcut($shortcut)
$link.TargetPath = $target
$link.WorkingDirectory = $Destination
$link.Description = 'Solve a programming problem to unlock your device'
$link.Save()
Write-Host "Start Menu shortcut: $shortcut"

if ($NoStart) {
  Write-Host 'Skipping launch (-NoStart). No login item is registered until you run it once.'
  return
}

# The app calls setAutoStart(true) on ready, but only when packaged — so the
# login item it writes points at wherever it was launched from. Launching the
# installed copy is what makes that path a stable one.
Start-Process -FilePath $target
Start-Sleep -Seconds 8

$run = Get-ItemProperty 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run' -ErrorAction SilentlyContinue
$entry = $run.PSObject.Properties |
  Where-Object { $_.Name -notlike 'PS*' -and $_.Value -like '*CodeLock.exe*' } |
  Select-Object -First 1

if ($entry) {
  Write-Host "Login item: $($entry.Name) -> $($entry.Value)"
  if ($entry.Value -notlike "$Destination*") {
    Write-Warning 'Login item does not point at the installed copy. Close any other CodeLock build and rerun.'
  }
} else {
  Write-Warning 'No login item registered. The app may still be starting; check again in a moment.'
}
