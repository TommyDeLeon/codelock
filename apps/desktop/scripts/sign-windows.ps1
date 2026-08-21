<#
.SYNOPSIS
  Sign CodeLock's Windows artifacts with a code-signing certificate.

.DESCRIPTION
  electron-builder can sign for you when CSC_LINK and CSC_KEY_PASSWORD are set,
  and in CI that is what happens. This script exists for the local case: you
  built unsigned, you want to sign what you already have, and you would rather
  not put a certificate password into an environment variable that ends up in
  your shell history.

  Every signature is timestamped via RFC 3161. This is not optional. Without a
  timestamp, the signature stops validating the moment the certificate expires,
  and a three-year self-signed certificate turns every installed copy of
  CodeLock into an untrusted binary on its expiry date. With one, signatures
  made while the certificate was valid stay valid forever.

.PARAMETER PfxPath
  Path to the .pfx holding the signing key. Keep this OUT of the repository.

.PARAMETER ReleaseDir
  Directory of built artifacts. Defaults to ..\release relative to this script.

.EXAMPLE
  .\sign-windows.ps1 -PfxPath D:\keys\codelock-signing.pfx

  Prompts for the password, signs every .exe under release\, and verifies each
  signature afterwards.
#>
[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [string]$PfxPath,

  [string]$ReleaseDir = (Join-Path $PSScriptRoot '..\release'),

  # DigiCert's public RFC 3161 endpoint. Any RFC 3161 server works; this one is
  # free and does not require an account.
  [string]$TimestampUrl = 'http://timestamp.digicert.com'
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path $PfxPath)) {
  throw "No certificate at $PfxPath. See docs/TRUSTED-INSTALL.md to create one."
}

# signtool ships with the Windows SDK and is not on PATH by default.
$signtool = Get-ChildItem 'C:\Program Files (x86)\Windows Kits\10\bin' -Recurse -Filter 'signtool.exe' -ErrorAction SilentlyContinue |
  Where-Object { $_.FullName -match '\\x64\\' } |
  Sort-Object FullName -Descending |
  Select-Object -First 1 -ExpandProperty FullName

if (-not $signtool) {
  throw @'
signtool.exe not found. Install the Windows SDK (the "Windows SDK Signing
Tools for Desktop Apps" component alone is enough):

  winget install Microsoft.WindowsSDK
'@
}

Write-Host "signtool: $signtool"

$artifacts = Get-ChildItem $ReleaseDir -Filter '*.exe' -File -ErrorAction SilentlyContinue
if (-not $artifacts) {
  throw "No .exe found in $ReleaseDir. Build first: npm run dist -w @codelock/desktop"
}

# Read the password as a SecureString so it never lands in history or a log.
$password = Read-Host -Prompt 'Certificate password' -AsSecureString
$plain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto(
  [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($password)
)

try {
  foreach ($artifact in $artifacts) {
    Write-Host "signing $($artifact.Name)..."
    & $signtool sign `
      /f $PfxPath `
      /p $plain `
      /fd SHA256 `
      /tr $TimestampUrl `
      /td SHA256 `
      /v `
      $artifact.FullName
    if ($LASTEXITCODE -ne 0) { throw "signtool failed on $($artifact.Name)" }
  }
}
finally {
  # Do not leave the password sitting in a variable for the rest of the session.
  $plain = $null
  [System.GC]::Collect()
}

Write-Host ''
Write-Host 'verifying...'
foreach ($artifact in $artifacts) {
  $sig = Get-AuthenticodeSignature $artifact.FullName
  '{0,-40} {1}  {2}' -f $artifact.Name, $sig.Status, $sig.SignerCertificate.Subject
}

Write-Host ''
Write-Host 'The certificate CN above must match publisherName in the release'
Write-Host 'workflow (CODELOCK_PUBLISHER_CN), or auto-update fails silently.'
