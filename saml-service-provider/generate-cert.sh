#!/bin/bash

# Script to generate self-signed certificates for SAML Service Provider
# These certificates are used for:
# 1. Signing SAML requests to the IdP
# 2. Decrypting encrypted SAML assertions from the IdP

echo "Generating SAML Service Provider certificates..."
echo ""

# Create certs directory if it doesn't exist
mkdir -p certs

# Generate private key
openssl genrsa -out certs/sp-key.pem 2048
echo "✓ Generated private key: certs/sp-key.pem"

# Generate self-signed certificate (valid for 365 days)
openssl req -new -x509 -key certs/sp-key.pem -out certs/sp-cert.pem -days 365 \
  -subj "/C=US/ST=State/L=City/O=Organization/OU=IT/CN=saml-service-provider"
echo "✓ Generated certificate: certs/sp-cert.pem"

echo ""
echo "Certificates generated successfully!"
echo ""
echo "IMPORTANT:"
echo "- Private key: certs/sp-key.pem (keep this SECRET!)"
echo "- Public cert: certs/sp-cert.pem (share in metadata with IdP)"
echo ""
echo "Next steps:"
echo "1. Update your .env file to use these certificates"
echo "2. Restart your server"
echo "3. Share your SP metadata (http://localhost:3000/metadata) with your IdP"
echo "4. The IdP will use the public cert to encrypt assertions sent to you"
