import { Router } from 'express';
import { login, getMe } from './authController';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.post('/login', login);
router.get('/me', authenticate, getMe);

export default router;
