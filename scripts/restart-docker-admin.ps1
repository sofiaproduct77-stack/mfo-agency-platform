# Restart Docker after WSL fix (Administrator)
$ErrorActionPreference = 'Continue'
Set-Service WSLService -StartupType Automatic
Start-Service WSLService -ErrorAction SilentlyContinue

Get-Process -Name "Docker Desktop","com.docker.backend","com.docker.build" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3
wsl --shutdown 2>$null
Start-Sleep -Seconds 2
Start-Service WSLService -ErrorAction SilentlyContinue

Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
Write-Host "Docker Desktop starting..."

$ready = $false
foreach ($i in 1..60) {
  Start-Sleep -Seconds 5
  docker info 2>$null | Out-Null
  if ($LASTEXITCODE -eq 0) {
    Write-Host "Docker ready after $($i*5)s"
    $ready = $true
    break
  }
}
if (-not $ready) {
  Write-Host "Docker not ready after 5 min - check Docker Desktop UI"
  docker info 2>&1 | Select-Object -Last 3
  exit 1
}
exit 0
