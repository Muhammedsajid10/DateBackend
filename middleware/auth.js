const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is not set in environment variables!');
  process.exit(1);
}

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRY = '1h';
const REFRESH_TOKEN_EXPIRY = '30d';

const generateToken = (userId) => {
  return jwt.sign({ 
    userId,
    type: 'access'
  }, JWT_SECRET, { 
    expiresIn: JWT_EXPIRY,
    algorithm: 'HS256'
  });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({
    userId,
    type: 'refresh'
  }, JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
    algorithm: 'HS256'
  });
};

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Invalid authorization header.'
      });
    }

    const token = authHeader.replace('Bearer ', '');

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid token.'
    });
  }
};

module.exports = {
  generateToken,
  verifyToken
};