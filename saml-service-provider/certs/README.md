# Certificates Directory

This directory contains SSL/TLS certificates and keys used for SAML signing and encryption.

## Quick Start

Generate SP certificates with one command:

```bash
npm run generate-cert
```

This creates:
- `sp-key.pem` - Service Provider private key (**keep this secret!**)
- `sp-cert.pem` - Service Provider public certificate (shared with IdP)

## What These Certificates Enable

### 1. Request Signing
Your SP can sign SAML authentication requests sent to the IdP. This allows the IdP to:
- Verify the request authenticity
- Prevent request tampering
- Trust that requests actually came from your application

### 2. Assertion Encryption
The IdP can encrypt SAML assertions sent to your SP. This:
- Protects sensitive user data in transit
- Ensures only your SP can decrypt the assertion
- Adds an extra layer of security beyond HTTPS

## Certificate Files

- `sp-key.pem` - **PRIVATE KEY** - Used for:
  - Signing SAML requests
  - Decrypting encrypted assertions
  - **Must be kept secret!**

- `sp-cert.pem` - **PUBLIC CERTIFICATE** - Used for:
  - Included in SP metadata
  - IdP uses it to encrypt assertions
  - IdP uses it to verify request signatures
  - Safe to share with IdP

- `idp-cert.pem` - IdP's public certificate (extracted from metadata automatically)

## Manual Generation

If you prefer to generate certificates manually:

```bash
# Generate a 2048-bit RSA private key
openssl genrsa -out sp-key.pem 2048

# Generate a self-signed certificate valid for 365 days
openssl req -new -x509 -key sp-key.pem -out sp-cert.pem -days 365
```

You'll be prompted for certificate details (country, organization, etc.).

## Production Considerations

### Security Best Practices

1. **Protect Private Keys**
   - Never commit `sp-key.pem` to version control (already in `.gitignore`)
   - Store in secure secret management systems (AWS Secrets Manager, Azure Key Vault, etc.)
   - Use appropriate file permissions (chmod 600 on Linux/Mac)
   - Consider using Hardware Security Modules (HSM) for high-security environments

2. **Certificate Rotation**
   - Rotate certificates before expiration (set calendar reminders)
   - Have a certificate renewal process in place
   - Test certificate updates in staging before production
   - Keep backup of old certificates during rotation period

3. **Use Proper CAs for Production**
   - Self-signed certificates work for development/testing
   - For production, consider certificates from trusted Certificate Authorities
   - Some organizations have internal CAs for enterprise applications

### Configuration

By default, the application looks for certificates at:
- `certs/sp-cert.pem`
- `certs/sp-key.pem`

To use different paths, set environment variables:
```bash
SAML_SP_CERT_PATH=/path/to/cert.pem
SAML_SP_KEY_PATH=/path/to/key.pem
```

## Verifying Certificates

Check certificate details:
```bash
openssl x509 -in sp-cert.pem -text -noout
```

Verify private key and certificate match:
```bash
openssl x509 -noout -modulus -in sp-cert.pem | openssl md5
openssl rsa -noout -modulus -in sp-key.pem | openssl md5
```
(The MD5 hashes should match)

## Troubleshooting

**Certificate not loading:**
- Check file permissions
- Verify files exist in `certs/` directory
- Check server logs for certificate loading messages

**IdP can't encrypt assertions:**
- Verify certificate is in SP metadata
- Check IdP has imported SP metadata
- Ensure IdP has encryption enabled

**"Invalid certificate" errors:**
- Verify certificate hasn't expired
- Check certificate format (PEM)
- Ensure private key matches certificate
