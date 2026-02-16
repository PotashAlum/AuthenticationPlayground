# SAML Service Provider

A Node.js implementation of a SAML 2.0 Service Provider (SP) using Express and Passport.

## Features

- SAML 2.0 authentication flow
- **Automatic IdP metadata fetching from URL** (supports Azure AD, Okta, etc.)
- Express-based web server
- Passport.js integration
- Session management
- Metadata endpoint for IdP configuration
- Support for signed/encrypted assertions
- User profile extraction from SAML assertions

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- A SAML Identity Provider (IdP) for testing

## Installation

1. Clone or navigate to this repository:
```bash
cd saml-service-provider
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:

Create a `.env` file in the project root (same directory as `package.json`):
```bash
cp .env.example .env
```

Edit the `.env` file and choose one of two configuration options:

**Option 1 (Recommended): Use IdP Metadata URL**
```bash
SAML_METADATA_URL=https://your-idp.com/metadata
```

**Option 2: Manual Configuration**
```bash
SAML_ENTRY_POINT=https://your-idp.com/sso
SAML_IDP_CERT=<certificate>
```

## Configuration

### Option 1: Automatic Configuration with Metadata URL (Recommended)

The easiest way to configure the service provider is to use your IdP's metadata URL. The application will automatically fetch and parse:
- SSO Entry Point
- IdP Certificate
- Logout URL
- NameID Format

#### Azure AD / Microsoft Entra ID

For Azure AD, your metadata URL will look like:
```
https://login.microsoftonline.com/{tenant-id}/federationmetadata/2007-06/federationmetadata.xml?appid={app-id}
```

Set this in your `.env`:
```bash
SAML_METADATA_URL=https://login.microsoftonline.com/00c28018-c233-4297-87e0-102766efad56/federationmetadata/2007-06/federationmetadata.xml?appid=392e0c42-2ef3-45d6-8561-4eb70f3e187a
SAML_ISSUER=saml-service-provider
SAML_CALLBACK_URL=http://localhost:3000/login/callback
```

#### Other IdPs (Okta, Auth0, etc.)

Most SAML IdPs provide a metadata URL. Check your IdP's documentation:
- **Okta**: `https://{your-domain}.okta.com/app/{app-id}/sso/saml/metadata`
- **Auth0**: `https://{tenant}.auth0.com/samlp/metadata/{client-id}`
- **SimpleSAMLphp**: `https://your-idp.com/saml2/idp/metadata.php`

### Option 2: Manual Configuration

If your IdP doesn't provide a metadata URL, configure manually in `.env`:

```bash
SAML_ENTRY_POINT=https://your-idp.com/sso
SAML_IDP_CERT=<certificate-content>
SAML_LOGOUT_URL=https://your-idp.com/logout
SAML_ISSUER=saml-service-provider
SAML_CALLBACK_URL=http://localhost:3000/login/callback
```

### 3. Share SP Metadata with IdP

Start the server and access the metadata endpoint:

```
http://localhost:3000/metadata
```

Share this metadata XML with your IdP administrator, or manually configure:
- **ACS URL**: http://localhost:3000/login/callback
- **Entity ID**: saml-service-provider
- **Name ID Format**: emailAddress

## Usage

### Start the Server

```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

The server will start on `http://localhost:3000`

### Endpoints

- `GET /` - Home page (shows login status)
- `GET /login` - Initiates SAML authentication
- `POST /login/callback` - Assertion Consumer Service (ACS) - receives SAML response
- `GET /metadata` - SP metadata endpoint
- `GET /logout` - Logout endpoint
- `GET /protected` - Example protected resource
- `GET /health` - Health check and configuration status

### Testing the Flow

1. Navigate to `http://localhost:3000`
2. Click "Login with SAML"
3. You'll be redirected to your IdP
4. Authenticate with your IdP credentials
5. After successful authentication, you'll be redirected back to the SP
6. Your user profile will be displayed

## SAML Concepts

### Service Provider (SP)
The application that relies on an Identity Provider for authentication. This project implements a Service Provider.

### Identity Provider (IdP)
The service that authenticates users and provides identity information to Service Providers.

### SAML Flow
1. User attempts to access the SP
2. SP generates a SAML authentication request
3. User is redirected to IdP with the SAML request
4. User authenticates with IdP
5. IdP generates a SAML response/assertion
6. User is redirected back to SP with SAML response
7. SP validates the SAML response
8. User is logged in to the SP

## Testing with Public IdPs

For testing purposes, you can use:

- **SAML-test.id**: https://saml-test.id/ (free SAML IdP for testing)
- **SimpleSAMLphp**: Self-hosted IdP solution
- **Okta Developer**: Free developer account with SAML support
- **Auth0**: Free tier with SAML support

## SP Certificate Setup (Recommended)

SP certificates enable two important security features:
1. **Signing SAML requests** - The IdP can verify requests came from your SP
2. **Decrypting encrypted assertions** - The IdP can encrypt sensitive data sent to you

### Generate SP Certificates

Run the built-in certificate generation script:

```bash
npm run generate-cert
```

Or manually using OpenSSL:

```bash
# Generate private key
openssl genrsa -out certs/sp-key.pem 2048

# Generate self-signed certificate (valid for 365 days)
openssl req -new -x509 -key certs/sp-key.pem -out certs/sp-cert.pem -days 365 \
  -subj "/C=US/ST=State/L=City/O=Organization/OU=IT/CN=saml-service-provider"
```

### What Happens After Generation

1. **Certificates are created in `certs/` folder:**
   - `sp-key.pem` - Private key (keep SECRET!)
   - `sp-cert.pem` - Public certificate (shared in metadata)

2. **Server automatically loads them** on startup (no .env changes needed)

3. **SP metadata includes the public certificate:**
   - Access `http://localhost:3000/metadata`
   - The certificate is embedded in the `<KeyDescriptor>` element
   - IdP will use this to encrypt assertions

4. **Configure your IdP:**
   - Share your SP metadata with the IdP administrator
   - Or manually copy the certificate from `certs/sp-cert.pem`
   - Enable assertion encryption in your IdP (Azure AD, Okta, etc.)

### Security Notes

- **Never commit `sp-key.pem` to version control** (already in `.gitignore`)
- Store private keys securely in production (secret management, HSM, etc.)
- Rotate certificates before expiration
- For production, consider using certificates from a trusted CA

### Without SP Certificates

The SP will still work without certificates, but:
- SAML requests won't be signed
- IdP cannot encrypt assertions
- Some IdPs may require signed requests

## Security Considerations

- Always use HTTPS in production
- Validate SAML responses and signatures
- Use secure session configuration
- Protect private keys
- Implement proper error handling
- Set appropriate CORS policies
- Use environment variables for sensitive data
- Implement rate limiting on authentication endpoints

## Troubleshooting

### Invalid Signature Error

If you're getting an "Invalid signature" error, the SAML response signature validation is failing. Common causes:

**1. IdP certificate not loaded:**
- Check server startup logs for "IdP Certificate loaded"
- Verify the certificate was extracted from metadata
- The certificate should be several hundred characters long
- If certificate is missing, the server will fail to start

**2. IdP not signing responses:**
- In Azure AD/Entra ID, verify SAML signing is enabled
- Check if your IdP is signing the assertion, response, or both
- Azure AD typically signs the assertion by default

**3. Certificate mismatch:**
- Ensure you're using the correct metadata URL for your application
- The certificate in metadata must match what the IdP is using to sign
- Try re-fetching metadata if the certificate was recently rotated

**4. IdP Entity ID mismatch:**
- Verify the Entity ID in your IdP matches `SAML_ISSUER` in your `.env`
- The issuer in the SAML response must match expectations

**5. Clock skew:**
- Ensure system clocks are synchronized between SP and IdP
- SAML assertions have timestamp validity windows

**Debugging:**
- Server logs show certificate info on startup
- Use a SAML tracer browser extension to inspect the actual response
- Check if the response and/or assertion is signed

---

### SAML Assertion Audience Mismatch

This error occurs when the audience value in the SAML assertion doesn't match what the service provider expects.

**Understanding the Issue:**
- The IdP includes an "Audience" field in the SAML assertion
- This must match the `SAML_ISSUER` value configured in your `.env`
- By default, the SP uses `SAML_ISSUER` for both the SP Entity ID and audience validation

**Solution 1: Update SAML_ISSUER to Match IdP (Recommended)**

1. Check your IdP configuration (Azure AD Enterprise Application):
   - Look for "Identifier (Entity ID)" in the SAML settings
   - Note what value is configured there

2. Update your `.env` file:
   ```bash
   SAML_ISSUER=<the-value-from-your-idp>
   ```

For Azure AD, this is often a URL like:
- `https://your-app-name`
- `urn:your-app-name`
- Or whatever was configured in the Enterprise Application

**Solution 2: Update IdP to Match SP**

In your IdP (e.g., Azure AD):
1. Go to Enterprise Application → SAML-based Sign-on
2. Set "Identifier (Entity ID)" to: `saml-service-provider`
3. Set "Reply URL (Assertion Consumer Service URL)" to: `http://localhost:3000/login/callback`

**Debugging Tips:**
- Check server logs for the expected audience value
- Use a SAML tracer browser extension to inspect the actual SAML response
- The error message in the console shows what was expected vs what was received

---

### Metadata URL Not Loading
- Check that the URL is accessible and returns valid XML
- Verify network connectivity and firewall settings
- Check the `/health` endpoint to see if metadata was loaded successfully
- Look at server logs for detailed error messages

### SAML Response Validation Failed
- Verify the IdP certificate is correct (check server logs to see what was extracted)
- Check that the clock is synchronized between SP and IdP
- Ensure the `issuer` matches what's configured in the IdP
- If using metadata URL, verify it's the correct URL for your application

### User Not Redirected After Login
- Check that the callback URL matches what's registered with the IdP
- Verify session configuration is correct
- Check browser console for errors
- Ensure the ACS URL is configured correctly in your IdP

### Server Won't Start
- Check that all environment variables are set correctly
- Verify that either `SAML_METADATA_URL` or `SAML_ENTRY_POINT` is configured
- Look at server logs for initialization errors

## Project Structure

```
saml-service-provider/
├── src/
│   ├── server.js           # Main application server
│   ├── saml-config.js      # SAML configuration and strategy
│   └── metadata-parser.js  # IdP metadata fetching and parsing
├── config/
│   └── idp-metadata-example.xml
├── certs/
│   └── README.md           # Certificate generation instructions
├── package.json
├── .env.example
├── .gitignore
└── README.md
```

## Development

To extend this service provider:

1. Modify `src/saml-config.js` to add custom attribute mappings
2. Update `src/server.js` to add new routes or middleware
3. Implement user persistence (database integration)
4. Add authorization logic for protected resources
5. Implement proper session storage (Redis, etc.)

## License

MIT

## Resources

- [SAML 2.0 Specification](http://docs.oasis-open.org/security/saml/Post2.0/sstc-saml-tech-overview-2.0.html)
- [Passport-SAML Documentation](https://github.com/node-saml/passport-saml)
- [Express.js Documentation](https://expressjs.com/)
