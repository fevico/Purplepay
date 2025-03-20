/**
 * StrollWallet API Configuration
 */

export const strollwalletConfig = {
  publicKey: process.env.PUBLIC_KEY,
  privateKey: process.env.PRIVATE_KEY,
  baseUrl: 'http://localhost:3001/api/bitvcard',
  defaultValues: {
    state: "Accra",
    city: "Accra",
    country: "Ghana",
    idType: "PASSPORT",
    cardType: "visa"
  }
};

/**
 * Validate API keys
 * @returns {boolean} True if API keys are configured, false otherwise
 */
export const validateApiKeys = () => {
  if (!strollwalletConfig.publicKey) {
    console.error('StrollWallet public key not configured');
    return false;
  }
  
  if (!strollwalletConfig.privateKey) {
    console.error('StrollWallet private key not configured');
    return false;
  }
  
  return true;
};
