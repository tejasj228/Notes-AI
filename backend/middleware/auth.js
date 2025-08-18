const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

// Middleware to authenticate JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is missing or invalid'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Token verification failed'
    });
  }
};

// Middleware to check if user owns the resource
const checkResourceOwnership = (Model, paramName = 'id') => {
  return async (req, res, next) => {
    console.log('🚨 CHECKRESOURCEOWNERSHIP CALLED!');
    console.log('🚨 Model:', Model);
    console.log('🚨 Model.modelName:', Model?.modelName);
    console.log('🚨 paramName:', paramName);
    console.log('🚨 req.params:', req.params);
    console.log('🚨 req.user:', req.user);
    
    try {
      const resourceId = req.params[paramName];
      console.log('🔍 checkResourceOwnership - Model:', Model.modelName);
      console.log('🔍 checkResourceOwnership - resourceId:', resourceId);
      console.log('🔍 checkResourceOwnership - userId:', req.user?._id);
      
      const resource = await Model.findById(resourceId);
      console.log('🔍 checkResourceOwnership - resource found:', !!resource);
      
      if (!resource) {
        console.log('❌ Resource not found');
        return res.status(404).json({
          success: false,
          message: 'Resource not found'
        });
      }

      console.log('🔍 checkResourceOwnership - resource.userId:', resource.userId);
      console.log('🔍 checkResourceOwnership - req.user._id:', req.user._id);
      
      if (resource.userId.toString() !== req.user._id.toString()) {
        console.log('❌ Ownership check failed');
        return res.status(403).json({
          success: false,
          message: 'Access denied: You do not own this resource'
        });
      }

      console.log('✅ Ownership check passed');
      req.resource = resource;
      next();
    } catch (error) {
      console.error('❌ Error in checkResourceOwnership:', error);
      return res.status(500).json({
        success: false,
        message: 'Error checking resource ownership'
      });
    }
  };
};

// Middleware for admin access (if needed in future)
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
};

// Middleware to validate user account status
const validateAccountStatus = (req, res, next) => {
  if (!req.user.isVerified) {
    return res.status(403).json({
      success: false,
      message: 'Please verify your email address to continue'
    });
  }
  next();
};

module.exports = {
  generateToken,
  authenticateToken,
  checkResourceOwnership,
  requireAdmin,
  validateAccountStatus
};
