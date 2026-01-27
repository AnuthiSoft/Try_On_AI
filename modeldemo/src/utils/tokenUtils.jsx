/**
 * Token Utility Functions
 * Helper functions for JWT token handling
 */

/**
 * Decode JWT token payload
 * @param {string} token - JWT token
 * @returns {Object|null} Decoded payload or null
 */
export const decodeToken = (token) => {
  try {
    if (!token || typeof token !== 'string') {
      throw new Error('Invalid token format');
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Token must have 3 parts');
    }

    const payload = parts[1];
    const decoded = JSON.parse(atob(payload));
    return decoded;
  } catch (error) {
    console.error('Token decode error:', error.message);
    return null;
  }
};

/**
 * Check if token is expired
 * @param {string} token - JWT token
 * @returns {boolean} True if expired
 */
export const isTokenExpired = (token) => {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;
  
  const currentTime = Math.floor(Date.now() / 1000);
  return decoded.exp < currentTime;
};

/**
 * Get remaining time until token expires (in seconds)
 * @param {string} token - JWT token
 * @returns {number} Seconds remaining
 */
export const getTokenRemainingTime = (token) => {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return 0;
  
  const currentTime = Math.floor(Date.now() / 1000);
  return Math.max(0, decoded.exp - currentTime);
};

/**
 * Format token expiration time
 * @param {string} token - JWT token
 * @returns {string} Formatted time string
 */
export const formatTokenExpiration = (token) => {
  const seconds = getTokenRemainingTime(token);
  if (seconds === 0) return 'Expired';
  
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `Expires in ${hours} hour${hours > 1 ? 's' : ''}`;
  } else if (minutes > 0) {
    return `Expires in ${minutes} minute${minutes > 1 ? 's' : ''}`;
  } else {
    return `Expires in ${seconds} second${seconds > 1 ? 's' : ''}`;
  }
};

/**
 * Validate token structure
 * @param {string} token - JWT token
 * @returns {boolean} True if valid structure
 */
export const isValidTokenFormat = (token) => {
  try {
    if (!token || typeof token !== 'string') return false;
    
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    // Check if all parts are base64 encoded
    parts.forEach(part => {
      atob(part.replace(/-/g, '+').replace(/_/g, '/'));
    });
    
    return true;
  } catch {
    return false;
  }
};

/**
 * Extract user info from token
 * @param {string} token - JWT token
 * @returns {Object} User information
 */
export const extractUserFromToken = (token) => {
  const decoded = decodeToken(token);
  if (!decoded) return null;
  
  return {
    userId: decoded.user_id,
    email: decoded.email,
    role: decoded.role,
    roleId: decoded.role_id,
    exp: decoded.exp,
    iat: decoded.iat
  };
};