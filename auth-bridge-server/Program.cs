using System.Diagnostics;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;

var builder = WebApplication.CreateBuilder(args);
builder.WebHost.UseUrls("http://localhost:5555");

var app = builder.Build();

// Store the native messaging process
Process? nativeProcess = null;
StreamWriter? nativeInput = null;
StreamReader? nativeOutput = null;

app.MapGet("/check-session", async () =>
{
    try
    {
        // Start native messaging host if not already running
        if (nativeProcess == null || nativeProcess.HasExited)
        {
            StartNativeMessagingHost();
        }

        // Send checkSession request
        var request = new { action = "checkSession" };
        var requestJson = JsonSerializer.Serialize(request);
        var requestBytes = Encoding.UTF8.GetBytes(requestJson);
        var lengthBytes = BitConverter.GetBytes(requestBytes.Length);

        await nativeInput!.BaseStream.WriteAsync(lengthBytes, 0, 4);
        await nativeInput.BaseStream.WriteAsync(requestBytes, 0, requestBytes.Length);
        await nativeInput.BaseStream.FlushAsync();

        // Read response
        var responseLengthBytes = new byte[4];
        await nativeOutput!.BaseStream.ReadAsync(responseLengthBytes, 0, 4);
        var responseLength = BitConverter.ToInt32(responseLengthBytes, 0);

        var responseBytes = new byte[responseLength];
        await nativeOutput.BaseStream.ReadAsync(responseBytes, 0, responseLength);
        var responseJson = Encoding.UTF8.GetString(responseBytes);

        return Results.Content(responseJson, "application/json");
    }
    catch (Exception ex)
    {
        return Results.Json(new { authenticated = false, error = ex.Message });
    }
});

app.MapGet("/ping", () => Results.Json(new { status = "ok" }));

void StartNativeMessagingHost()
{
    var hostPath = @"D:\repos\SamlSsoPlayground\native-messaging-host\bin\Release\net8.0\NativeMessagingHost.dll";

    nativeProcess = new Process
    {
        StartInfo = new ProcessStartInfo
        {
            FileName = "dotnet",
            Arguments = hostPath,
            UseShellExecute = false,
            RedirectStandardInput = true,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            CreateNoWindow = true
        }
    };

    nativeProcess.Start();
    nativeInput = nativeProcess.StandardInput;
    nativeOutput = nativeProcess.StandardOutput;
}

app.Run();
