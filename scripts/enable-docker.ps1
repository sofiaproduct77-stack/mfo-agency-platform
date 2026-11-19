#Requires -RunAsAdministrator
Write-Host "Enabling WSL and Virtual Machine Platform for Docker..."
Enable-WindowsOptionalFeature -Online -FeatureName VirtualMachinePlatform -All -NoRestart
Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Windows-Subsystem-Linux -All -NoRestart
Write-Host ""
Write-Host "Done. RESTART Windows, then start Docker Desktop and run:"
Write-Host "  cd $env:USERPROFILE\Projects\mfo-agency-platform"
Write-Host "  npm run setup:local"
Write-Host "  npm run dev"
