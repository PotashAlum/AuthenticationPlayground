# Install Native Messaging Host for Chrome Extension
# Run this script as Administrator

param(
    [Parameter(Mandatory=$true)]
    [string]$ExtensionId
)

Write-Host "=== Installing Native Messaging Host ===" -ForegroundColor Green
Write-Host "Extension ID: $ExtensionId" -ForegroundColor Cyan

# Update the manifest with the correct extension ID
$manifestPath = Join-Path $PSScriptRoot "auth-host-manifest.json"
$manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json
$manifest.allowed_origins = @("chrome-extension://$ExtensionId/")
$manifest | ConvertTo-Json -Depth 10 | Set-Content $manifestPath

Write-Host "`nManifest updated successfully!" -ForegroundColor Green

# Register the native messaging host with Chrome
$registryPath = "HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.saml.authhost"

if (Test-Path $registryPath) {
    Write-Host "`nRemoving existing registry entry..." -ForegroundColor Yellow
    Remove-Item $registryPath -Force
}

Write-Host "Creating registry entry..." -ForegroundColor Yellow
New-Item -Path $registryPath -Force | Out-Null
New-ItemProperty -Path $registryPath -Name "(Default)" -Value $manifestPath -Force | Out-Null

Write-Host "`n=== Installation Complete! ===" -ForegroundColor Green
Write-Host "Native messaging host registered at: $registryPath" -ForegroundColor Cyan
Write-Host "Manifest location: $manifestPath" -ForegroundColor Cyan
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Build the desktop app (dotnet publish)" -ForegroundColor White
Write-Host "2. Reload the extension in Chrome" -ForegroundColor White
Write-Host "3. Test the connection" -ForegroundColor White
