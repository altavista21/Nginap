param(
  [Parameter(Mandatory = $true)][string]$DataDirectory,
  [Parameter(Mandatory = $true)][string]$BackupDirectory,
  [Parameter(Mandatory = $true)][string]$ServiceAccount
)

$ErrorActionPreference = "Stop"

$identity = [System.Security.Principal.NTAccount]::new($ServiceAccount)
$null = $identity.Translate([System.Security.Principal.SecurityIdentifier])

foreach ($directory in @($DataDirectory, $BackupDirectory)) {
  $resolved = [System.IO.Path]::GetFullPath($directory)
  New-Item -ItemType Directory -Force -Path $resolved | Out-Null

  & icacls.exe $resolved /inheritance:r | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "Failed to disable inherited ACLs on $resolved" }

  & icacls.exe $resolved /grant:r "${ServiceAccount}:(OI)(CI)M" "SYSTEM:(OI)(CI)F" "BUILTIN\Administrators:(OI)(CI)F" /T /C | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "Failed to apply restrictive ACLs on $resolved" }
}

Write-Host "Storage ACLs applied. Only the service account can modify Nginap data and backups; SYSTEM and local Administrators retain full control."
Write-Host "Next: verify the Windows service runs as '$ServiceAccount' and confirm BitLocker protection with: manage-bde -status $env:SystemDrive"
