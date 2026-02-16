# Quick Start Guide - .NET Framework SAML SP

## Prerequisites Check

Before you begin, make sure you have:

- [ ] Windows 10/11 (required for .NET Framework)
- [ ] Visual Studio 2019 or 2022 installed
- [ ] .NET Framework 4.8 installed (usually pre-installed on Windows 10/11)

## 5-Minute Setup

### Step 1: Open the Project

1. Navigate to `dotnet-saml-service-provider` folder
2. Double-click `DotNetFrameworkSamlSP.sln` to open in Visual Studio

### Step 2: Restore Packages

Visual Studio will automatically restore NuGet packages. Wait for the restore to complete (check the status bar).

If packages don't restore automatically:
- Right-click solution → **Restore NuGet Packages**

### Step 3: Update Azure Configuration (Optional)

If you want to use your own Azure tenant:

1. Open `Web.config`
2. Find the `<sustainsys.saml2>` section
3. Replace `YOUR-TENANT-ID` and `YOUR-APP-ID` with your values

**Current default configuration:**
- Tenant ID: `00c28018-c233-4297-87e0-102766efad56`
- App ID: `392e0c42-2ef3-45d6-8561-4eb70f3e187a`

### Step 4: Run the Application

1. Press **F5** or click the green **Start** button
2. Your browser will open to `http://localhost:5000`
3. You should see the SAML Service Provider home page

### Step 5: Test Authentication

1. Click **"Login with SAML"** button
2. You'll be redirected to Azure AD login
3. Enter your Microsoft credentials
4. After successful login, you'll be redirected back
5. Your user claims will be displayed

## Troubleshooting

### "NuGet packages are missing"

**Solution:**
```
Tools → NuGet Package Manager → Package Manager Console
Update-Package -reinstall
```

### "Port 5000 is already in use"

**Solution:**
1. Right-click project → Properties
2. Go to **Web** tab
3. Change the port number under **Project Url**

### "Cannot open project file"

**Solution:**
- Make sure you're using Visual Studio 2019 or later
- Try: File → Open → Project/Solution → select `DotNetFrameworkSamlSP.csproj`

### "Build failed"

**Solution:**
1. Clean solution: Build → Clean Solution
2. Rebuild: Build → Rebuild Solution

## Next Steps

Once the app is running:

1. **View Metadata**: Navigate to http://localhost:5000/Saml2
2. **Configure Azure AD**: Use the endpoints shown on the home page
3. **Test Full Flow**: Login, view claims, logout

## Azure AD Configuration

To configure Azure Entra ID with this SP:

1. Go to Azure Portal → Entra ID → Enterprise Applications
2. Create/select your SAML app
3. Configure **Single sign-on** with these values:

```
Entity ID:     dotnet-framework-saml-sp
Reply URL:     http://localhost:5000/Saml2/Acs
Sign on URL:   http://localhost:5000/Auth/Login
Logout URL:    http://localhost:5000/Auth/Logout
```

4. (Optional) Upload certificate: `DotNetFrameworkSamlSP\certs\sp-cert.cer`

## File Structure at a Glance

```
DotNetFrameworkSamlSP/
├── Web.config              ← SAML configuration here
├── Controllers/
│   ├── HomeController.cs   ← Main page
│   └── AuthController.cs   ← Login/Logout logic
├── Views/
│   └── Home/
│       └── Index.cshtml    ← UI with claims display
└── certs/
    ├── sp-cert.pfx         ← For .NET (signing/encryption)
    └── sp-cert.cer         ← Upload to Azure
```

## Common Tasks

### Enable Certificate Signing

Edit `Web.config`, uncomment:
```xml
<serviceCertificates>
  <add fileName="~/certs/sp-cert.pfx" use="Both" />
</serviceCertificates>
```

### Change Entity ID

Edit `Web.config`:
```xml
<sustainsys.saml2 entityId="your-new-entity-id" ...>
```

### Debug SAML Flow

1. Add breakpoint in `AuthController.cs`
2. Press F5 to debug
3. Watch the SAML request/response in debugger

## Need Help?

Check the full **README.md** for:
- Detailed architecture explanation
- Advanced configuration
- Certificate management
- Comparison with Node.js version

---

**Ready to start?** Open `DotNetFrameworkSamlSP.sln` in Visual Studio and press F5!
