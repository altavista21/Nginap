param(
  [Parameter(Mandatory = $true)][string]$DataDirectory,
  [Parameter(Mandatory = $true)][string]$BackupDirectory,
  [Parameter(Mandatory = $true)][string]$EnvironmentFile,
  [Parameter(Mandatory = $true)][string]$ServiceAccount
)

$ErrorActionPreference = "Stop"

$identity = [System.Security.Principal.NTAccount]::new($ServiceAccount)
$null = $identity.Translate([System.Security.Principal.SecurityIdentifier])

foreach ($directory in @($DataDirectory, $BackupDirectory)) {
  $resolved = [System.IO.Path]::GetFullPath($directory)
  New-Item -ItemType Directory -Force -Path $resolved | Out-Null

  & icacls.exe $resolved /reset /T /C | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "Failed to reset existing ACLs on $resolved" }
  & icacls.exe $resolved /inheritance:r /T /C | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "Failed to disable inherited ACLs on $resolved" }

  & icacls.exe $resolved /grant:r "${ServiceAccount}:(OI)(CI)M" "*S-1-5-18:(OI)(CI)F" "*S-1-5-32-544:(OI)(CI)F" /T /C | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "Failed to apply restrictive ACLs on $resolved" }
}

$environmentPath = [System.IO.Path]::GetFullPath($EnvironmentFile)
if (-not (Test-Path -LiteralPath $environmentPath -PathType Leaf)) { throw "Environment file not found: $environmentPath" }
& icacls.exe $environmentPath /reset | Out-Null
if ($LASTEXITCODE -ne 0) { throw "Failed to reset existing ACLs on $environmentPath" }
& icacls.exe $environmentPath /inheritance:r | Out-Null
if ($LASTEXITCODE -ne 0) { throw "Failed to disable inherited ACLs on $environmentPath" }
& icacls.exe $environmentPath /grant:r "${ServiceAccount}:R" "*S-1-5-18:F" "*S-1-5-32-544:F" | Out-Null
if ($LASTEXITCODE -ne 0) { throw "Failed to apply restrictive ACLs on $environmentPath" }

Write-Host "Storage ACLs applied. The service account can modify workbook/backups and read the environment file; SYSTEM and local Administrators retain full control."
Write-Host "Next: verify the Windows service runs as '$ServiceAccount' and confirm BitLocker protection with: manage-bde -status $env:SystemDrive"
