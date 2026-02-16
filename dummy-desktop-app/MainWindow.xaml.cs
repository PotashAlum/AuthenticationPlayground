using System;
using System.Diagnostics;
using System.IO;
using System.Text;
using System.Threading.Tasks;
using System.Windows;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace DummyDesktopApp
{
    public partial class MainWindow : Window
    {
        private const string AUTH_APP_URL = "https://localhost:44300";
        private const string NATIVE_HOST_PATH = @"D:\repos\SamlSsoPlayground\native-messaging-host\bin\Release\net8.0\NativeMessagingHost.dll";

        private bool isAuthenticated = false;
        private UserInfo? currentUser = null;

        public MainWindow()
        {
            InitializeComponent();
            Loaded += MainWindow_Loaded;
        }

        private async void MainWindow_Loaded(object sender, RoutedEventArgs e)
        {
            await CheckAuthenticationAndLogin();
        }

        private async Task CheckAuthenticationAndLogin()
        {
            SetStatus("Checking authentication status...", true);

            var extensionResult = await CheckExtensionSession();

            if (extensionResult.Success && extensionResult.User != null)
            {
                ShowAuthenticated(extensionResult.User);
                return;
            }

            // No session found, trigger login automatically
            SetStatus("No session found. Opening browser for authentication...", false);
            await Task.Delay(1000); // Brief delay to show the message

            TriggerBrowserLogin();
        }

        private async Task CheckAuthentication()
        {
            SetStatus("Checking authentication status...", true);

            var extensionResult = await CheckExtensionSession();

            if (extensionResult.Success && extensionResult.User != null)
            {
                ShowAuthenticated(extensionResult.User);
                return;
            }

            ShowNotAuthenticated("Not authenticated. Waiting for login...");
        }

        private void TriggerBrowserLogin()
        {
            try
            {
                // Open the auth app in the default browser
                // The returnType=token tells the auth app that this is coming from extension/app
                var psi = new ProcessStartInfo
                {
                    FileName = $"{AUTH_APP_URL}/Auth/Login?returnType=token",
                    UseShellExecute = true
                };
                Process.Start(psi);

                SetStatus("Browser opened. Please complete authentication...", false);

                // Start polling for authentication
                _ = PollForAuthentication();
            }
            catch (Exception ex)
            {
                MessageBox.Show($"Failed to open browser: {ex.Message}", "Error", MessageBoxButton.OK, MessageBoxImage.Error);
            }
        }

        private async Task PollForAuthentication()
        {
            // Poll every 2 seconds for up to 5 minutes
            for (int i = 0; i < 150; i++)
            {
                await Task.Delay(2000);

                var extensionResult = await CheckExtensionSession();

                if (extensionResult.Success && extensionResult.User != null)
                {
                    ShowAuthenticated(extensionResult.User);
                    return;
                }
            }

            // Timeout after 5 minutes
            SetStatus("Login timeout. Please try again.", false);
        }

        private async Task<(bool Success, UserInfo? User)> CheckExtensionSession()
        {
            Process? process = null;
            try
            {
                // Start native messaging host
                process = new Process
                {
                    StartInfo = new ProcessStartInfo
                    {
                        FileName = "dotnet",
                        Arguments = NATIVE_HOST_PATH,
                        UseShellExecute = false,
                        RedirectStandardInput = true,
                        RedirectStandardOutput = true,
                        CreateNoWindow = true
                    }
                };

                process.Start();

                // Send getSession request
                var request = new JObject { ["action"] = "getSession" };
                var requestJson = JsonConvert.SerializeObject(request);
                var requestBytes = Encoding.UTF8.GetBytes(requestJson);
                var lengthBytes = BitConverter.GetBytes(requestBytes.Length);

                await process.StandardInput.BaseStream.WriteAsync(lengthBytes, 0, 4);
                await process.StandardInput.BaseStream.WriteAsync(requestBytes, 0, requestBytes.Length);
                await process.StandardInput.BaseStream.FlushAsync();

                // Read response
                var responseLengthBytes = new byte[4];
                await process.StandardOutput.BaseStream.ReadAsync(responseLengthBytes, 0, 4);
                var responseLength = BitConverter.ToInt32(responseLengthBytes, 0);

                var responseBytes = new byte[responseLength];
                await process.StandardOutput.BaseStream.ReadAsync(responseBytes, 0, responseLength);
                var responseJson = Encoding.UTF8.GetString(responseBytes);

                var response = JObject.Parse(responseJson);

                // Close the process
                process.Kill();

                // Parse response
                if (response["authenticated"]?.Value<bool>() == true)
                {
                    var session = response["session"];
                    var user = session?["user"];

                    if (user != null)
                    {
                        return (true, new UserInfo
                        {
                            Name = user["name"]?.ToString() ?? "Unknown",
                            Email = user["email"]?.ToString() ?? "Unknown"
                        });
                    }
                }

                return (false, null);
            }
            catch (Exception ex)
            {
                SetStatus($"Failed to communicate with extension: {ex.Message}", false);
                return (false, null);
            }
            finally
            {
                try
                {
                    if (process != null && !process.HasExited)
                    {
                        process.Kill();
                    }
                    process?.Dispose();
                }
                catch { }
            }
        }

        private void LoginButton_Click(object sender, RoutedEventArgs e)
        {
            TriggerBrowserLogin();
        }

        private void CheckExtensionButton_Click(object sender, RoutedEventArgs e)
        {
            MessageBox.Show(
                "Extension Communication:\n\n" +
                "Desktop apps communicate with browser extensions via Chrome Native Messaging. " +
                "This requires registering a native messaging host.\n\n" +
                "For this demo, the communication is simulated. In production:\n" +
                "1. Register native messaging host with Chrome\n" +
                "2. Desktop app reads from stdin and writes to stdout\n" +
                "3. Extension sends messages via chrome.runtime.connectNative\n\n" +
                "See: https://developer.chrome.com/docs/apps/nativeMessaging/",
                "Extension Communication",
                MessageBoxButton.OK,
                MessageBoxImage.Information
            );
        }

        private void LogoutButton_Click(object sender, RoutedEventArgs e)
        {
            // Clear local state
            isAuthenticated = false;
            currentUser = null;

            ShowNotAuthenticated("Logged out successfully.");
        }

        private void SetStatus(string message, bool showLoading)
        {
            StatusText.Text = message;
            LoadingBar.Visibility = showLoading ? Visibility.Visible : Visibility.Collapsed;
        }

        private void ShowAuthenticated(UserInfo user)
        {
            isAuthenticated = true;
            currentUser = user;

            SetStatus("Authenticated successfully!", false);

            UserNameText.Text = user.Name;
            UserEmailText.Text = user.Email;
            UserInfoPanel.Visibility = Visibility.Visible;

            LoginButton.Visibility = Visibility.Collapsed;
            LogoutButton.Visibility = Visibility.Visible;
        }

        private void ShowNotAuthenticated(string message)
        {
            isAuthenticated = false;
            currentUser = null;

            SetStatus(message, false);

            UserInfoPanel.Visibility = Visibility.Collapsed;
            LoginButton.Visibility = Visibility.Visible;
            LogoutButton.Visibility = Visibility.Collapsed;
        }
    }

    public class UserInfo
    {
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
    }
}
