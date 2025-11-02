import express from 'express';
import {
  registerUser,
  loginUser,
  getProfile,
  validateRegistration,
  validateLogin
} from '../controllers/userController.js';
import { authenticateToken } from '../middleware/auth.js';
import { rateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Apply rate limiting to all auth routes
router.use(rateLimiter);

// Public routes
router.post('/register', validateRegistration, registerUser);  // POST /api/users/register
router.post('/login', validateLogin, loginUser);              // POST /api/users/login

// Protected routes (require authentication)
router.use(authenticateToken); // All routes below require authentication

router.get('/profile', getProfile);                           // GET /api/users/profile

export default router;