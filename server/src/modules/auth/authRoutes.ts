import { Router } from 'express';
import {
  login,
  getMe,
  getProfile,
  updateProfile,
  changePassword,
  getAllUsers,
  adminResetPassword,
} from './authController';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.post('/login', login);
router.get('/me', authenticate, getMe);
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.post('/change-password', authenticate, changePassword);
router.get('/users', authenticate, getAllUsers);
router.post('/admin/reset-password', authenticate, adminResetPassword);

export default router;
