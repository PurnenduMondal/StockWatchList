import Stock from '../models/Stock.js';
import { AppError, catchAsync } from '../middleware/errorHandler.js';
import axios from 'axios';

// Get all stocks in user's watchlist
export const getAllStocks = catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const skip = (page - 1) * limit;

  // Ensure reasonable limits
  if (limit > 100) {
    return next(new AppError('Limit cannot exceed 100', 400));
  }

  // Get stocks for the authenticated user only
  const stocks = await Stock.find({ user: req.user.id })
    .sort({ addedAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Stock.countDocuments({ user: req.user.id });

  res.status(200).json({
    success: true,
    message: 'Stocks retrieved successfully',
    data: {
      stocks: stocks.map(stock => ({
        id: stock._id,
        symbol: stock.symbol,
        name: stock.name,
        addedAt: stock.addedAt,
        lastUpdated: stock.lastUpdated
      })),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalStocks: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    }
  });
});

// Add a new stock to user's watchlist
export const addStock = async (req, res, next) => {
  try {
    const { symbol, name } = req.body;

    // Validate required fields
    if (!symbol) {
      return next(new AppError('Stock symbol is required', 400));
    }

    const normalizedSymbol = symbol.toUpperCase().trim();

    // Check if stock already exists in user's watchlist
    const existingStock = await Stock.findOne({ 
      symbol: normalizedSymbol, 
      user: req.user.id 
    });
    
    if (existingStock) {
      return next(new AppError('Stock already exists in your watchlist', 409));
    }

    // Create new stock
    const newStock = new Stock({
      symbol: normalizedSymbol,
      name: name?.trim() || '',
      user: req.user.id
    });

    await newStock.save();

    res.status(201).json({
      success: true,
      message: 'Stock added to watchlist successfully',
      data: {
        stock: newStock.toSafeObject()
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return next(new AppError('Stock already exists in your watchlist', 409));
    }
    next(error);
  }
};

// Remove a stock from user's watchlist
export const removeStock = async (req, res, next) => {
  try {
    const { symbol } = req.params;

    const normalizedSymbol = symbol.toUpperCase().trim();

    // Delete stock from user's watchlist only
    const deletedStock = await Stock.findOneAndDelete({ 
      symbol: normalizedSymbol, 
      user: req.user.id 
    });
    
    if (!deletedStock) {
      return next(new AppError('Stock not found in your watchlist', 404));
    }

    res.status(200).json({
      success: true,
      message: 'Stock removed from watchlist successfully',
      data: {
        removedStock: {
          symbol: deletedStock.symbol,
          name: deletedStock.name
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Search stocks using Yahoo Finance API
export const searchStocks = async (req, res, next) => {
  try {
    const { q } = req.query;

    // Validate query parameter
    if (!q || typeof q !== 'string') {
      return next(new AppError('Search query is required', 400));
    }

    const query = q.trim();
    if (query.length < 1 || query.length > 50) {
      return next(new AppError('Search query must be between 1 and 50 characters', 400));
    }

    // Sanitize query to prevent any malicious input
    const sanitizedQuery = query.replace(/[^a-zA-Z0-9\s]/g, '');
    if (sanitizedQuery.length === 0) {
      return next(new AppError('Invalid search query', 400));
    }

    const options = {
      method: 'GET',
      url: 'https://apidojo-yahoo-finance-v1.p.rapidapi.com/auto-complete',
      params: {
        region: 'US',
        q: sanitizedQuery
      },
      headers: {
        'x-rapidapi-host': 'apidojo-yahoo-finance-v1.p.rapidapi.com',
        'x-rapidapi-key': process.env.RAPIDAPI_KEY
      },
      timeout: 10000 // 10 second timeout
    };

    // Check if API key is configured
    if (!process.env.RAPIDAPI_KEY) {
      return next(new AppError('External API service not configured', 500));
    }

    const response = await axios.request(options);
    
    // Extract relevant data from the response
    const results = response.data?.quotes || [];
    
    // Filter and format the results
    const formattedResults = results
      .filter(stock => stock.symbol && stock.shortname)
      .slice(0, 20) // Limit to top 20 results
      .map(stock => ({
        symbol: stock.symbol,
        name: stock.shortname || stock.longname || '',
        exchange: stock.exchange || '',
        type: stock.quoteType || ''
      }));

    res.status(200).json({
      success: true,
      message: 'Stock search completed successfully',
      data: {
        query: sanitizedQuery,
        results: formattedResults,
        totalResults: formattedResults.length
      }
    });

  } catch (error) {
    // Handle different types of errors
    if (error.code === 'ECONNABORTED') {
      return next(new AppError('External API request timeout', 504));
    }
    
    if (error.response) {
      // API responded with error status
      const status = error.response.status;
      if (status === 429) {
        return next(new AppError('API rate limit exceeded. Please try again later', 429));
      } else if (status === 401 || status === 403) {
        return next(new AppError('External API authentication failed', 502));
      } else {
        return next(new AppError('External API service unavailable', 502));
      }
    } else if (error.request) {
      // Network error
      return next(new AppError('Unable to reach external API service', 503));
    }
    
    // Log the error for debugging (don't expose sensitive info)
    console.error('Stock search error:', error.message);
    next(new AppError('Stock search failed', 500));
  }
};