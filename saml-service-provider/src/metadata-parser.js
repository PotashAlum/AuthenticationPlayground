const axios = require('axios');
const { parseString } = require('xml2js');

/**
 * Fetches and parses SAML metadata from a URL
 * @param {string} metadataUrl - The URL of the IdP metadata
 * @returns {Promise<Object>} Parsed metadata configuration
 */
async function fetchMetadata(metadataUrl) {
  try {
    console.log(`Fetching IdP metadata from: ${metadataUrl}`);

    const response = await axios.get(metadataUrl, {
      headers: {
        'Accept': 'application/xml, text/xml'
      },
      timeout: 10000
    });

    const metadata = await parseMetadataXml(response.data);
    console.log('Successfully parsed IdP metadata');

    return metadata;
  } catch (error) {
    console.error('Error fetching metadata:', error.message);
    throw new Error(`Failed to fetch metadata from ${metadataUrl}: ${error.message}`);
  }
}

/**
 * Parses SAML metadata XML
 * @param {string} xml - The metadata XML string
 * @returns {Promise<Object>} Parsed metadata configuration
 */
function parseMetadataXml(xml) {
  return new Promise((resolve, reject) => {
    parseString(xml, {
      tagNameProcessors: [stripPrefix],
      attrNameProcessors: [stripPrefix],
      explicitArray: false
    }, (err, result) => {
      if (err) {
        return reject(err);
      }

      try {
        const config = extractSamlConfig(result);
        resolve(config);
      } catch (error) {
        reject(error);
      }
    });
  });
}

/**
 * Strips namespace prefixes from XML tags
 */
function stripPrefix(name) {
  const match = name.match(/(?:.*:)?(.+)/);
  return match ? match[1] : name;
}

/**
 * Extracts SAML configuration from parsed metadata
 * @param {Object} metadata - Parsed XML metadata object
 * @returns {Object} SAML configuration
 */
function extractSamlConfig(metadata) {
  const descriptor = metadata.EntityDescriptor;

  if (!descriptor) {
    throw new Error('Invalid metadata: EntityDescriptor not found');
  }

  const idpDescriptor = descriptor.IDPSSODescriptor;

  if (!idpDescriptor) {
    throw new Error('Invalid metadata: IDPSSODescriptor not found');
  }

  // Extract entity ID
  const entityId = descriptor.$.entityID;

  // Extract certificates
  const certificates = extractCertificates(idpDescriptor);

  // Extract SSO endpoints
  const ssoEndpoints = extractSsoEndpoints(idpDescriptor);

  // Extract SLO (Single Logout) endpoints
  const sloEndpoints = extractSloEndpoints(idpDescriptor);

  const config = {
    entryPoint: ssoEndpoints.redirect || ssoEndpoints.post,
    logoutUrl: sloEndpoints.redirect || sloEndpoints.post,
    cert: certificates.signing || certificates.encryption,
    issuer: entityId,
    identifierFormat: extractNameIdFormat(idpDescriptor)
  };

  console.log('Extracted SAML config:', {
    entityId: config.issuer,
    entryPoint: config.entryPoint,
    logoutUrl: config.logoutUrl,
    hasCertificate: !!config.cert
  });

  return config;
}

/**
 * Extracts certificates from IdP descriptor
 */
function extractCertificates(idpDescriptor) {
  const certificates = {
    signing: null,
    encryption: null
  };

  const keyDescriptors = Array.isArray(idpDescriptor.KeyDescriptor)
    ? idpDescriptor.KeyDescriptor
    : [idpDescriptor.KeyDescriptor].filter(Boolean);

  keyDescriptors.forEach(keyDescriptor => {
    if (!keyDescriptor) return;

    const use = keyDescriptor.$.use;
    const cert = keyDescriptor.KeyInfo?.X509Data?.X509Certificate;

    if (cert) {
      // Remove whitespace and newlines from certificate
      const cleanCert = cert.replace(/\s+/g, '');

      if (use === 'signing') {
        certificates.signing = cleanCert;
      } else if (use === 'encryption') {
        certificates.encryption = cleanCert;
      } else if (!use) {
        // If no use specified, use for both
        certificates.signing = certificates.signing || cleanCert;
        certificates.encryption = certificates.encryption || cleanCert;
      }
    }
  });

  return certificates;
}

/**
 * Extracts SSO endpoints from IdP descriptor
 */
function extractSsoEndpoints(idpDescriptor) {
  const endpoints = {
    redirect: null,
    post: null
  };

  const ssoServices = Array.isArray(idpDescriptor.SingleSignOnService)
    ? idpDescriptor.SingleSignOnService
    : [idpDescriptor.SingleSignOnService].filter(Boolean);

  ssoServices.forEach(service => {
    if (!service) return;

    const binding = service.$.Binding;
    const location = service.$.Location;

    if (binding.includes('HTTP-Redirect')) {
      endpoints.redirect = location;
    } else if (binding.includes('HTTP-POST')) {
      endpoints.post = location;
    }
  });

  return endpoints;
}

/**
 * Extracts SLO (Single Logout) endpoints from IdP descriptor
 */
function extractSloEndpoints(idpDescriptor) {
  const endpoints = {
    redirect: null,
    post: null
  };

  if (!idpDescriptor.SingleLogoutService) {
    return endpoints;
  }

  const sloServices = Array.isArray(idpDescriptor.SingleLogoutService)
    ? idpDescriptor.SingleLogoutService
    : [idpDescriptor.SingleLogoutService].filter(Boolean);

  sloServices.forEach(service => {
    if (!service) return;

    const binding = service.$.Binding;
    const location = service.$.Location;

    if (binding.includes('HTTP-Redirect')) {
      endpoints.redirect = location;
    } else if (binding.includes('HTTP-POST')) {
      endpoints.post = location;
    }
  });

  return endpoints;
}

/**
 * Extracts NameID format from IdP descriptor
 */
function extractNameIdFormat(idpDescriptor) {
  if (!idpDescriptor.NameIDFormat) {
    return 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress';
  }

  const formats = Array.isArray(idpDescriptor.NameIDFormat)
    ? idpDescriptor.NameIDFormat
    : [idpDescriptor.NameIDFormat];

  // Prefer email format if available
  const emailFormat = formats.find(f => f.includes('emailAddress'));
  return emailFormat || formats[0] || 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress';
}

module.exports = {
  fetchMetadata,
  parseMetadataXml
};
