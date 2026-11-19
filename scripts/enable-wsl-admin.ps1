# Requires elevation (Run as Administrator)
$ErrorActionPreference = 'Stop'
Set-Service WSLService -StartupType Automatic
Start-Service WSLService
Write-Host "WSLService:" (Get-Service WSLService | Select-Object Status, StartType | Out-String)
wsl --status
Write-Host "OK"
