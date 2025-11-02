import { SignJWT, jwtVerify } from 'jose';
import User from '../models/User.js';
import { AppError } from './errorHandler.js';

// Middleware to verify JWT token
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null;

    if (!token) {
      return next(new AppError('Access token required', 401));
    }

    // Verify token using jose
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret, {
      issuer: 'stock-watchlist-api'
    });
    
    // Get user from token
    const user = await User.findById(payload.userId).select('-password');
    
    if (!user) {
      return next(new AppError('User not found', 401));
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.code === 'ERR_JWT_INVALID') {
      return next(new AppError('Invalid token', 401));
    }
    if (error.code === 'ERR_JWT_EXPIRED') {
      return next(new AppError('Token expired', 401));
    }
    next(error);
  }
};

// Optional authentication middleware (doesn't require token but adds user if present)
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null;

    if (token) {
      try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret, {
          issuer: 'stock-watchlist-api'
        });
        const user = await User.findById(payload.userId).select('-password');
        
        if (user && user.isActive) {
          req.user = user;
        }
      } catch (error) {
        // Ignore token errors for optional auth
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

// Generate JWT token
export const generateToken = async (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }
  
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  
  // Convert expiration time to seconds
  const expirationTime = expiresIn.endsWith('d') 
    ? parseInt(expiresIn) * 24 * 60 * 60 
    : parseInt(expiresIn);
  
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer('stock-watchlist-api')
    .setExpirationTime(Math.floor(Date.now() / 1000) + expirationTime)
    .sign(secret);
  
  return token;
};

// Middleware to check if user owns the resource
export const checkResourceOwnership = (resourceUserField = 'user') => {
  return (req, res, next) => {
    const resource = req.resource; // This should be set by the route handler
    
    if (!resource) {
      return next(new AppError('Resource not found', 404));
    }

    const resourceUserId = resource[resourceUserField];
    
    if (!resourceUserId || resourceUserId.toString() !== req.user.id) {
      return next(new AppError('Access denied: insufficient permissions', 403));
    }
    
    next();
  };
};