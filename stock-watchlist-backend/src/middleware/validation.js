import { AppError } from './errorHandler.js';
import { validateStockSymbol } from '../utils/validators.js';

// Request validation middleware
export const validateRequest = (req, res, next) => {
  try {
    // Sanitize request body
    if (req.body) {
      // Remove any potentially dangerous properties
      const dangerousProps = ['__proto__', 'constructor', 'prototype'];
      dangerousProps.forEach(prop => {
        if (req.body.hasOwnProperty(prop)) {
          delete req.body[prop];
        }
      });

      // Validate and sanitize each field
      Object.keys(req.body).forEach(key => {
        if (typeof req.body[key] === 'string') {
          // Basic XSS prevention - remove script tags and dangerous content
          req.body[key] = req.body[key]
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '');
          
          // Trim whitespace
          req.body[key] = req.body[key].trim();
        }
      });
    }

    // Validate Content-Type for POST/PUT requests
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      const contentType = req.get('Content-Type');
      if (contentType && !contentType.includes('application/json')) {
        return next(new AppError('Content-Type must be application/json', 400));
      }
    }

    // Check request size
    const contentLength = parseInt(req.get('Content-Length')) || 0;
    if (contentLength > 1024 * 1024) { // 1MB limit
      return next(new AppError('Request entity too large', 413));
    }

    next();
  } catch (error) {
    next(new AppError('Invalid request format', 400));
  }
};

// Stock-specific validation middleware
export const validateStockData = (req, res, next) => {
  const { symbol, name } = req.body;

  // Validate name if provided
  if (name !== undefined) {
    if (typeof name !== 'string') {
      return next(new AppError('Stock name must be a string', 400));
    }
    
    if (name.length > 100) {
      return next(new AppError('Stock name must not exceed 100 characters', 400));
    }

    // Check for potentially malicious content
    const maliciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /eval\(/i,
      /function\s*\(/i
    ];

    if (maliciousPatterns.some(pattern => pattern.test(name))) {
      return next(new AppError('Invalid characters in stock name', 400));
    }
  }

  next();
};

// Parameter validation middleware
export const validateStockSymbolParam = (req, res, next) => {
  const { symbol } = req.params;

  if (!symbol) {
    return next(new AppError('Stock symbol parameter is required', 400));
  }

  const symbolValidation = validateStockSymbol(symbol);
  if (!symbolValidation.isValid) {
    return next(new AppError(symbolValidation.message, 400));
  }

  next();
};

// Query parameter validation
export const validateQueryParams = (req, res, next) => {
  const { page, limit, sort } = req.query;

  // Validate page
  if (page !== undefined) {
    const pageNum = parseInt(page);
    if (isNaN(pageNum) || pageNum < 1) {
      return next(new AppError('Page must be a positive integer', 400));
    }
    if (pageNum > 1000) {
      return next(new AppError('Page number too large', 400));
    }
  }

  // Validate limit
  if (limit !== undefined) {
    const limitNum = parseInt(limit);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return next(new AppError('Limit must be between 1 and 100', 400));
    }
  }

  // Validate sort
  if (sort !== undefined) {
    const allowedSortFields = ['symbol', 'name', 'addedAt', 'lastUpdated'];
    const sortField = sort.replace(/^-/, ''); // Remove descending indicator
    if (!allowedSortFields.includes(sortField)) {
      return next(new AppError('Invalid sort field', 400));
    }
  }

  next();
};