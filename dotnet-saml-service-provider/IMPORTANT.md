# IMPORTANT: Visual Studio Required

## ⚠️ This .NET Framework Project Requires Visual Studio

This project is built with **.NET Framework 4.8** and **ASP.NET MVC 5**, which are **Windows-only** technologies that require **Visual Studio** to build and run.

### Why Can't I Build with `dotnet build`?

The `dotnet` CLI is designed for **.NET Core** and **.NET 5+** (cross-platform). It has **limited support** for .NET Framework projects and cannot:
- Properly restore .NET Framework NuGet packages
- Build ASP.NET MVC web applications
- Run IIS Express for debugging

### ✅ How to Use This Project

**You MUST use one of these:**

1. **Visual Studio 2019 or 2022** (Recommended)
   - Free Community Edition is fine
   - Download: https://visualstudio.microsoft.com/downloads/

2. **MSBuild** (for build only, not recommended)
   - Requires Visual Studio Build Tools
   - More complex setup

### 📝 Step-by-Step Instructions

#### Option 1: Visual Studio (Recommended)

1. **Install Visual Studio 2019 or 2022**
   - Download from: https://visualstudio.microsoft.com/downloads/
   - During installation, select "ASP.NET and web development" workload

2. **Open the Project**
   - Double-click `DotNetFrameworkSamlSP.sln`
   - OR: File → Open → Project/Solution → select the .sln file

3. **Restore NuGet Packages**
   - Visual Studio will automatically restore packages
   - If not: Right-click solution → "Restore NuGet Packages"

4. **Run the Application**
   - Press `F5` or click the green "Start" button
   - The app will launch on http://localhost:5000

#### Option 2: Using MSBuild (Advanced)

If you don't want to install Visual Studio:

```cmd
# 1. Install Visual Studio Build Tools
# Download from: https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022

# 2. Install NuGet CLI
# Download from: https://www.nuget.org/downloads

# 3. Restore packages
cd dotnet-saml-service-provider\DotNetFrameworkSamlSP
nuget restore

# 4. Build with MSBuild
"C:\Program Files\Microsoft Visual Studio\2022\BuildTools\MSBuild\Current\Bin\MSBuild.exe" DotNetFrameworkSamlSP.csproj

# 5. Run with IIS Express (if installed)
"C:\Program Files\IIS Express\iisexpress.exe" /path:%CD% /port:5000
```

### 🤔 Why Not Use .NET Core?

.NET Framework was specifically requested for this implementation. If you want a cross-platform version that works with `dotnet` CLI, consider:

1. **Using the Node.js version** in `saml-service-provider/` folder
2. **Creating a .NET Core version** (requires code migration)

### 🆚 Comparison

| Feature | .NET Framework (This Project) | .NET Core/5+/.NET 8 |
|---------|------------------------------|---------------------|
| **CLI Support** | ❌ Limited | ✅ Full |
| **Cross-Platform** | ❌ Windows only | ✅ Windows, macOS, Linux |
| **Requires Visual Studio** | ✅ Yes | ❌ No (VS Code works) |
| **IIS Support** | ✅ Native | ✅ Via hosting module |
| **Performance** | Good | Better |
| **Legacy Support** | ✅ Excellent | ⚠️ Limited |

### 💡 Alternative: .NET 8 Version

If you need cross-platform support and want to use `dotnet` CLI, I can create a **.NET 8** version instead. It would:
- ✅ Work with `dotnet build` and `dotnet run`
- ✅ Run on Windows, macOS, and Linux
- ✅ Work in VS Code
- ✅ Be more modern and performant

Let me know if you'd like me to create that version!

### 📚 Resources

- [Download Visual Studio](https://visualstudio.microsoft.com/downloads/)
- [Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022)
- [.NET Framework vs .NET Core](https://docs.microsoft.com/en-us/dotnet/standard/choosing-core-framework-server)

---

**TL;DR**: Open `DotNetFrameworkSamlSP.sln` in **Visual Studio 2019/2022** and press **F5**. That's it!
