const jwt = require('jsonwebtoken');
const config = require('../../utils/config');
const logger = require('../../utils/logger');

/**
 * Middleware to authenticate JWT tokens
 */
function authenticateToken(req, res, next) {
  // Get the auth header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    logger.warn('Authentication failed: No token provided');
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  jwt.verify(token, config.jwt.secret, (err, user) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        logger.warn('Authentication failed: Token expired');
        return res.status(401).json({ message: 'Token expired' });
      }
      
      logger.warn(`Authentication failed: ${err.message}`);
      return res.status(403).json({ message: 'Invalid token' });
    }
    
    // Token is valid, set the user in the request object
    req.user = user;
    next();
  });
}

module.exports = {
  authenticateToken
};