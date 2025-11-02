import express from 'express';
import { 
  getAllStocks, 
  addStock, 
  removeStock, 
  searchStocks
} from '../controllers/stockController.js';
import { validateRequest } from '../middleware/validation.js';
import { rateLimiter } from '../middleware/rateLimiter.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Apply rate limiting to all stock routes
router.use(rateLimiter);

// Public routes
router.get('/search', searchStocks);             // GET /api/stocks/search?q=query - Search stocks

// Protected routes (require authentication)
router.use(authenticateToken); // All routes below require authentication

router.get('/', getAllStocks);                    // GET /api/stocks - Get user's stocks
router.post('/', validateRequest, addStock);     // POST /api/stocks - Add stock to user's watchlist
router.delete('/:symbol', removeStock);          // DELETE /api/stocks/:symbol - Remove stock from user's watchlist

export default router;