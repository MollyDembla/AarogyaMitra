import express from 'express';
import {
  loginAdmin,
  getAdminMe,
  getAdminStats,
  getAdminUsers,
  getAdminUserDetails,
  getAdminLogs,
  getAdminMcpLogs
} from '../controllers/adminController.js';
import { protectAdmin } from '../middleware/adminAuth.js';

const router = express.Router();

// Public Admin Login route
router.post('/login', loginAdmin);

// Protected Admin Routes
router.get('/me', protectAdmin, getAdminMe);
router.get('/stats', protectAdmin, getAdminStats);
router.get('/users', protectAdmin, getAdminUsers);
router.get('/users/:userId/details', protectAdmin, getAdminUserDetails);
router.get('/logs', protectAdmin, getAdminLogs);
router.get('/mcp-logs', protectAdmin, getAdminMcpLogs);

export default router;
