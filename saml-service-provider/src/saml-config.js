const SamlStrategy = require("passport-saml").Strategy;
const fs = require("fs");
const path = require("path");
const { fetchMetadata } = require("./metadata-parser");

/**
 * Load SP certificates if available
 */
function loadSpCertificates() {
  const certPath =
    process.env.SAML_SP_CERT_PATH ||
    path.join(__dirname, "../certs/sp-cert.pem");
  const keyPath =
    process.env.SAML_SP_KEY_PATH || path.join(__dirname, "../certs/sp-key.pem");

  try {
    if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
      const privateKey = fs.readFileSync(keyPath, "utf-8");
      const publicCert = fs.readFileSync(certPath, "utf-8");

      console.log("SP certificates loaded successfully");
      console.log("  - Certificate:", certPath);
      console.log("  - Private key:", keyPath);

      return [privateKey, publicCert];
    } else {
      console.log("SP certificates not found (optional)");
      console.log("  Looking for:", certPath, "and", keyPath);
      return null;
    }
  } catch (error) {
    console.warn("Failed to load SP certificates:", error.message);
    return null;
  }
}

/**
 * Initialize SAML configuration from metadata URL if provided
 */
async function initializeSamlConfig() {
  // Base SAML configuration
  let samlConfig = {
    // Service Provider (SP) configuration
    callbackUrl:
      process.env.SAML_CALLBACK_URL || "http://localhost:3000/login/callback",
    issuer: process.env.SAML_ISSUER || "saml-service-provider",

    // These will be populated from metadata or environment variables
    entryPoint: process.env.SAML_ENTRY_POINT || null,
    cert: process.env.SAML_IDP_CERT || null,
    logoutUrl: process.env.SAML_LOGOUT_URL || null,

    // SP certificate/key for signing requests and decrypting assertions
    // Load from environment variables or certificate files
    privateCert: null, // Will be set during initialization
    decryptionPvk: null, // Will be set during initialization (same as privateCert)

    // Additional options
    identifierFormat: null, // Will be set from metadata or default
    signatureAlgorithm: "sha256",
    digestAlgorithm: "sha256",

    // Audience restriction (optional - if not set, uses issuer value)
    audience: process.env.SAML_AUDIENCE || false,

    // Clock skew tolerance (in milliseconds)
    acceptedClockSkewMs: -1,

    // Signature validation (always enabled for security)
    wantAssertionsSigned: true,
    wantAuthnResponseSigned: true,

    // Attribute mapping
    attributeConsumingServiceIndex: false,
    disableRequestedAuthnContext: true,

    // Force authentication
    forceAuthn: false,

    // Passive authentication
    passive: false,

    // Logout configuration (optional)
    logoutCallbackUrl:
      process.env.SAML_LOGOUT_CALLBACK_URL ||
      "http://localhost:3000/logout/callback",
  };

  const metadataUrl = process.env.SAML_METADATA_URL;

  // Load SP certificates first
  const [privateKey, publicCert] = loadSpCertificates();
  console.log("Loaded SP Certificates:", {
    privateKey: privateKey,
    publicCert: publicCert,
  });
  if (metadataUrl) {
    try {
      console.log("Loading SAML configuration from metadata URL...");
      const metadataConfig = await fetchMetadata(metadataUrl);

      // Merge metadata config with base config (metadata takes precedence)
      samlConfig = {
        ...samlConfig,
        entryPoint: metadataConfig.entryPoint || samlConfig.entryPoint,
        cert: metadataConfig.cert || samlConfig.cert,
        logoutUrl: metadataConfig.logoutUrl || samlConfig.logoutUrl,
        identifierFormat:
          metadataConfig.identifierFormat || samlConfig.identifierFormat,
        privateCert: publicCert || samlConfig.privateCert,
        decryptionPvk: privateKey || samlConfig.decryptionPvk,
        decryptionCert: publicCert || samlConfig.decryptionCert,
      };
    } catch (error) {
      console.error("Failed to load metadata:", error.message);
    }
  } else {
    console.log(
      "No metadata URL provided, using environment variable configuration",
    );
    // Set certificates if loaded
    if (privateKey) {
      samlConfig.privateCert = publicCert;
      samlConfig.decryptionPvk = privateKey;
      samlConfig.decryptionCert = publicCert;
    }
  }

  // Set default identifier format if not set
  if (!samlConfig.identifierFormat) {
    samlConfig.identifierFormat =
      "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress";
  }

  // Validate required configuration
  if (!samlConfig.entryPoint) {
    throw new Error("SAML_ENTRY_POINT or SAML_METADATA_URL must be configured");
  }

  if (!samlConfig.cert) {
    throw new Error(
      "IdP certificate is required. Ensure SAML_IDP_CERT is set or metadata URL is valid.",
    );
  }

  return samlConfig;
}

/**
 * Configure SAML strategy with Passport
 */
async function createSamlStrategy(samlConfig) {
  
  return new SamlStrategy(
    samlConfig,
    (profile, done) => {
      // This callback is called when authentication succeeds
      // profile contains the user information from the SAML assertion

      console.log("SAML authentication successful!");
      console.log("NameID:", profile.nameID);
      console.log("Issuer:", profile.issuer);

      // You can process the profile here and map it to your user model
      const user = {
        id: profile.nameID,
        email: profile.email || profile.mail || profile.nameID,
        firstName:
          profile.firstName ||
          profile.givenName ||
          profile[
            "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname"
          ],
        lastName:
          profile.lastName ||
          profile.surname ||
          profile[
            "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname"
          ],
        displayName:
          profile.displayName ||
          profile.name ||
          profile["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name"],
        // Add any other attributes from the SAML response
        attributes: profile,
      };

      return done(null, user);
    },
    (profile, done) => {
      // This callback is called when authentication fails
      console.error("SAML authentication error callback triggered");
      return done(null, false);
    },
  );
}

module.exports = {
  initializeSamlConfig,
  createSamlStrategy,
};
