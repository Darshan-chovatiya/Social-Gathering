const crypto = require('crypto');
const config = require('../config/env');

// Algorithm and settings
const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16; // For AES, this is always 16

/**
 * Encrypts a string using AES-256-CBC
 * @param {string} text - The text to encrypt
 * @returns {string} - The encrypted text in format iv:encryptedData
 */
const encrypt = (text) => {
  if (!text) return null;
  
  // Use ENCRYPTION_KEY from env, fallback to a default for development (NOT recommended for production)
  const key = crypto.scryptSync(config.JWT_SECRET || 'fallback_key', 'salt', 32);
  const iv = crypto.randomBytes(IV_LENGTH);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  
  return iv.toString('hex') + ':' + encrypted.toString('hex');
};

/**
 * Decrypts a string encrypted with the encrypt function
 * @param {string} text - The encrypted text in format iv:encryptedData
 * @returns {string} - The decrypted text
 */
const decrypt = (text) => {
  if (!text) return null;
  
  try {
    const textParts = text.split(':');
    if (textParts.length !== 2) return text; // Probably not encrypted

    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    
    const key = crypto.scryptSync(config.JWT_SECRET || 'fallback_key', 'salt', 32);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString();
  } catch (error) {
    console.error('Decryption failed:', error);
    return null;
  }
};

module.exports = {
  encrypt,
  decrypt,
};
