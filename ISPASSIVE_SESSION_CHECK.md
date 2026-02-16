# IdP Session Verification with SAML IsPassive

## Overview

When a client application requests a token from the extension, the extension now verifies that the Identity Provider (IdP) session is still active before returning a token. This prevents the extension from issuing tokens based on stale sessions.

## How It Works

### Flow Diagram

```
Client App                Extension              Auth Web App           Azure AD (IdP)
    |                        |                         |                      |
    |--requestToken()------->|                         |                      |
    |                        |                         |                      |
    |                        |--Check stored session-->|                      |
    |                        |                         |                      |
    |                        |--Verify IdP session---->|                      |
    |                        |   (hidden tab)          |                      |
    |                        |                         |                      |
    |                        |                         |--SAML Request------->|
    |                        |                         |  (IsPassive=true)    |
    |                        |                         |                      |
    |                        |                         |<--SAML Response------|
    |                        |                         |  (success/failure)   |
    |                        |                         |                      |
    |                        |<--Session valid/invalid-|                      |
    |                        |                         |                      |
    |<--Return token---------|                         |                      |
    |   or authUrl           |                         |                      |
```

### Detailed Steps

1. **Client Requests Token**
   - Web or desktop app sends `requestToken` message to extension

2. **Extension Checks Local Session**
   - Verifies session exists in extension storage
   - Checks if session hasn't expired (24-hour local timeout)

3. **Extension Verifies IdP Session**
   - Creates a hidden background tab
   - Navigates to `/SessionCheck/Verify` endpoint
   - This triggers SAML authentication with `IsPassive=true`

4. **SAML IsPassive Request**
   - Auth app redirects to Azure AD with `IsPassive=true` flag
   - Azure AD checks if user has an active session
   - **If session exists**: Azure AD returns SAML assertion without user interaction
   - **If no session**: Azure AD returns error without showing login page

5. **Extension Processes Result**
   - **Success**: Extension generates and returns one-time token
   - **Failure**: Extension clears stored session and returns authUrl for re-authentication

6. **Client Receives Response**
   - **Got token**: Client validates token with backend
   - **Got authUrl**: Client opens browser for user to re-authenticate

## Implementation Details

### Extension Changes (`background.js`)

**New Function**: `checkIdPSession()`
```javascript
async function checkIdPSession() {
  // Creates hidden tab to verify IdP session
  // Uses IsPassive SAML authentication
  // Returns true if session valid, false if expired
}
```

**Updated Function**: `handleRequestToken()`
```javascript
async function handleRequestToken(sendResponse) {
  // 1. Check local session exists
  // 2. Verify IdP session with checkIdPSession()
  // 3. If IdP session expired, clear local session
  // 4. Generate token only if IdP session is valid
}
```

### Auth App Changes

**New Controller**: `SessionCheckController.cs`
- `/SessionCheck/Verify` - Initiates IsPassive authentication
- `/SessionCheck/VerifyCallback` - Receives SAML response
- `/SessionCheck/Success` - Returns "OK" if session valid
- `/SessionCheck/Failure` - Returns "EXPIRED" if session invalid

**SAML Configuration**:
- Sustainsys.Saml2 automatically supports `IsPassive` query parameter
- No Web.config changes needed
- Azure AD respects the IsPassive flag

## Benefits

### Security
- **No Stale Tokens**: Extension won't issue tokens after IdP session expires
- **Centralized Session Control**: IdP controls session lifetime
- **Logout Propagation**: IdP logout automatically invalidates extension tokens

### User Experience
- **Silent Verification**: No user interaction during session check
- **Seamless Re-auth**: Clear error message when re-authentication needed
- **Fast Response**: Hidden tab verification completes in ~1-2 seconds

## Configuration

### Extension Permissions

The extension requires `webNavigation` permission to detect when the hidden tab completes navigation:

```json
"permissions": [
  "storage",
  "tabs",
  "identity",
  "webNavigation"
]
```

### Timeout Settings

**IdP Check Timeout**: 10 seconds
- If verification doesn't complete in 10 seconds, assume session expired
- Prevents hanging if IdP is unreachable

**Token Expiry**: 5 minutes
- One-time tokens expire after 5 minutes
- Prevents token replay attacks

**Session Expiry**: 24 hours
- Local extension session expires after 24 hours
- Forces IdP check at least once per day

## SAML IsPassive Flag

### What is IsPassive?

The SAML `IsPassive` flag tells the IdP:
- **true**: Only authenticate if user has an active session
- **false** (default): Show login page if no active session

### Azure AD Behavior

When `IsPassive=true`:
- **Active Session**: Returns SAML assertion immediately
- **No Session**: Returns error status without user interaction
- **Never**: Shows login page or prompts for credentials

### Request Example

```
https://login.microsoftonline.com/.../saml2?
  SAMLRequest=<base64-encoded-request>
  &IsPassive=true
```

The Sustainsys.Saml2 library automatically includes this parameter when you pass `IsPassive=true` in the SignIn URL.

## Error Handling

### IdP Session Expired

**Response from Extension**:
```javascript
{
  success: false,
  sessionExpired: true,
  authUrl: "http://localhost:60427/Auth/Login?returnType=token"
}
```

**Client Action**:
- Open authUrl in browser
- User re-authenticates with IdP
- Auth app saves new session to extension
- Client polls for authentication completion

### IdP Unreachable

**Response from Extension**:
```javascript
{
  success: false,
  error: "IdP verification timeout",
  authUrl: "http://localhost:60427/Auth/Login?returnType=token"
}
```

**Client Action**:
- Same as session expired
- User may need to check internet connection

## Testing

### Test Session Valid

1. Login to auth app
2. Request token from extension
3. Extension creates hidden tab
4. Verify network shows SAML request with IsPassive=true
5. Extension returns token successfully

### Test Session Expired

1. Login to auth app
2. Logout from Azure AD directly (or wait for timeout)
3. Request token from extension
4. Extension creates hidden tab
5. SAML request fails with IsPassive
6. Extension returns authUrl
7. Client opens browser for re-authentication

### Test Network Failure

1. Login to auth app
2. Disconnect internet
3. Request token from extension
4. Extension times out after 10 seconds
5. Extension returns authUrl

## Production Considerations

### Performance

- **Latency**: Adds 1-2 seconds to token request
- **Network Calls**: One additional SAML roundtrip per token request
- **Optimization**: Consider caching IdP session check for 1-2 minutes

### Caching Strategy

**Option 1**: Cache IdP check result
```javascript
let lastIdpCheck = null;
let lastIdpCheckTime = 0;

async function checkIdPSession() {
  // Return cached result if checked within last 60 seconds
  if (lastIdpCheck !== null && Date.now() - lastIdpCheckTime < 60000) {
    return lastIdpCheck;
  }

  // Perform actual check
  const result = await performIdpCheck();
  lastIdpCheck = result;
  lastIdpCheckTime = Date.now();
  return result;
}
```

**Trade-off**:
- Reduces latency for frequent token requests
- Increases risk of issuing token with expired IdP session
- 60-second window is reasonable compromise

### Azure AD Session Lifetime

Azure AD session lifetime can be configured in Azure Portal:
- **Default**: 24 hours of inactivity
- **Conditional Access**: Can force shorter sessions
- **Remember Me**: Can extend up to 90 days

Your extension respects the IdP's session settings.

## Troubleshooting

### Hidden Tab Visible to User

**Symptom**: User briefly sees tab flash
**Solution**: Tab is created with `active: false`, should be invisible
**Check**: Ensure Chrome/Edge supports background tabs

### IsPassive Always Fails

**Symptom**: Extension always reports session expired
**Possible Causes**:
1. Azure AD not configured to support IsPassive
2. Cookies being blocked in hidden tabs
3. CORS or CSP issues

**Debug**:
- Check browser console in hidden tab
- Verify SAML response in network tab
- Test manual IsPassive request in browser

### Performance Issues

**Symptom**: Token requests take >5 seconds
**Possible Causes**:
1. Slow network to Azure AD
2. Azure AD under heavy load
3. Extension timeout too long

**Optimization**:
- Reduce timeout from 10s to 5s
- Implement caching strategy
- Pre-check IdP session on extension startup

## References

- [SAML 2.0 Core Specification](http://docs.oasis-open.org/security/saml/v2.0/saml-core-2.0-os.pdf) - Section 3.4.1.1 (IsPassive)
- [Sustainsys.Saml2 Documentation](https://github.com/Sustainsys/Saml2)
- [Azure AD SAML Protocol](https://learn.microsoft.com/en-us/entra/identity-platform/single-sign-on-saml-protocol)
- [Chrome Extension Native Messaging](https://developer.chrome.com/docs/extensions/develop/concepts/native-messaging)
