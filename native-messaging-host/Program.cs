using System;
using System.IO;
using System.Text;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

class NativeMessagingHost
{
    private static readonly string SessionFilePath = Path.Combine(Path.GetTempPath(), "auth-extension-session.json");
    private static readonly string LogPath = Path.Combine(Path.GetTempPath(), "auth-host-log.txt");

    static void Main(string[] args)
    {
        // Log to file for debugging
        File.AppendAllText(LogPath, $"[{DateTime.Now}] Native messaging host started\n");

        try
        {
            while (true)
            {
                // Read message length (4 bytes)
                var lengthBytes = new byte[4];
                var bytesRead = Console.OpenStandardInput().Read(lengthBytes, 0, 4);

                if (bytesRead == 0)
                {
                    File.AppendAllText(LogPath, $"[{DateTime.Now}] No more input, exiting\n");
                    break;
                }

                var messageLength = BitConverter.ToInt32(lengthBytes, 0);
                File.AppendAllText(LogPath, $"[{DateTime.Now}] Message length: {messageLength}\n");

                // Read message
                var messageBytes = new byte[messageLength];
                bytesRead = Console.OpenStandardInput().Read(messageBytes, 0, messageLength);
                var messageJson = Encoding.UTF8.GetString(messageBytes, 0, bytesRead);

                File.AppendAllText(LogPath, $"[{DateTime.Now}] Received: {messageJson}\n");

                // Parse message
                var message = JObject.Parse(messageJson);

                // Process message and create response
                var response = ProcessMessage(message);

                // Send response
                SendMessage(response);
                File.AppendAllText(LogPath, $"[{DateTime.Now}] Sent: {JsonConvert.SerializeObject(response)}\n");
            }
        }
        catch (Exception ex)
        {
            File.AppendAllText(LogPath, $"[{DateTime.Now}] Error: {ex}\n");
        }
    }

    static JObject ProcessMessage(JObject message)
    {
        var action = message["action"]?.ToString();

        return action switch
        {
            "ping" => new JObject { ["response"] = "pong" },

            // Extension sends this to update session state
            "updateSession" => HandleUpdateSession(message),

            // Extension sends this to clear session
            "clearSession" => HandleClearSession(),

            // Desktop app or extension requests current session
            "getSession" => HandleGetSession(),

            _ => new JObject { ["error"] = "Unknown action" }
        };
    }

    static JObject HandleUpdateSession(JObject message)
    {
        try
        {
            var sessionData = message["session"];
            File.WriteAllText(SessionFilePath, sessionData?.ToString() ?? "{}");
            File.AppendAllText(LogPath, $"[{DateTime.Now}] Session updated\n");

            return new JObject { ["success"] = true };
        }
        catch (Exception ex)
        {
            File.AppendAllText(LogPath, $"[{DateTime.Now}] Error updating session: {ex}\n");
            return new JObject { ["success"] = false, ["error"] = ex.Message };
        }
    }

    static JObject HandleClearSession()
    {
        try
        {
            if (File.Exists(SessionFilePath))
            {
                File.Delete(SessionFilePath);
            }
            File.AppendAllText(LogPath, $"[{DateTime.Now}] Session cleared\n");

            return new JObject { ["success"] = true };
        }
        catch (Exception ex)
        {
            File.AppendAllText(LogPath, $"[{DateTime.Now}] Error clearing session: {ex}\n");
            return new JObject { ["success"] = false, ["error"] = ex.Message };
        }
    }

    static JObject HandleGetSession()
    {
        try
        {
            if (!File.Exists(SessionFilePath))
            {
                return new JObject { ["authenticated"] = false };
            }

            var sessionJson = File.ReadAllText(SessionFilePath);
            var session = JObject.Parse(sessionJson);

            return new JObject
            {
                ["authenticated"] = true,
                ["session"] = session
            };
        }
        catch (Exception ex)
        {
            File.AppendAllText(LogPath, $"[{DateTime.Now}] Error getting session: {ex}\n");
            return new JObject { ["authenticated"] = false, ["error"] = ex.Message };
        }
    }

    static void SendMessage(JObject message)
    {
        var json = JsonConvert.SerializeObject(message);
        var bytes = Encoding.UTF8.GetBytes(json);
        var length = bytes.Length;
        var lengthBytes = BitConverter.GetBytes(length);

        var stdout = Console.OpenStandardOutput();
        stdout.Write(lengthBytes, 0, 4);
        stdout.Write(bytes, 0, bytes.Length);
        stdout.Flush();
    }
}
