# Setup HTTPS for .NET Framework SAML Service Provider
# Run this script with PowerShell as Administrator

Write-Host "=== Setting up HTTPS for .NET Framework SAML SP ===" -ForegroundColor Green

# Step 1: Trust the IIS Express development certificate
Write-Host "`n1. Trusting IIS Express SSL certificate..." -ForegroundColor Yellow
$certPath = "$env:ProgramFiles\IIS Express\config\templates\PersonalStore\localhost.pfx"
if (Test-Path $certPath) {
    $cert = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2($certPath)
    $store = New-Object System.Security.Cryptography.X509Certificates.X509Store("Root", "CurrentUser")
    $store.Open("ReadWrite")
    $store.Add($cert)
    $store.Close()
    Write-Host "   Certificate trusted successfully!" -ForegroundColor Green
} else {
    Write-Host "   IIS Express certificate not found. Will be auto-generated on first run." -ForegroundColor Cyan
}

# Step 2: Update Web.config
Write-Host "`n2. Updating Web.config for HTTPS..." -ForegroundColor Yellow
$webConfigPath = ".\DotNetFrameworkSamlSP\Web.config"
$webConfig = Get-Content $webConfigPath -Raw
$webConfig = $webConfig -replace 'returnUrl="http://localhost:60427/"', 'returnUrl="https://localhost:44300/"'
Set-Content $webConfigPath $webConfig
Write-Host "   Web.config updated!" -ForegroundColor Green

# Step 3: Instructions
Write-Host "`n=== Next Steps ===" -ForegroundColor Green
Write-Host "1. Close Visual Studio completely"
Write-Host "2. Delete the .vs folder: dotnet-saml-service-provider\.vs"
Write-Host "3. Reopen the solution in Visual Studio"
Write-Host "4. Press F5 to run - it should start on https://localhost:44300"
Write-Host "`n5. Update Azure AD with HTTPS URLs:"
Write-Host "   - Reply URL: https://localhost:44300/Saml2/Acs"
Write-Host "   - Sign on URL: https://localhost:44300/Auth/Login"
Write-Host "   - Logout URL: https://localhost:44300/Auth/Logout"
Write-Host "`nIf you get a certificate warning in browser, click 'Advanced' -> 'Proceed to localhost'" -ForegroundColor Cyan
