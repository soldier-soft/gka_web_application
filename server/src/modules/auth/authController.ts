import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../../models/User';
import { Client } from '../../models/Client';
import { ENV } from '../../config/env';
import { AuthUserPayload } from '../../middleware/auth';

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required.' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !user.isActive) {
      res.status(401).json({ success: false, message: 'Invalid credentials or inactive account.' });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid credentials.' });
      return;
    }

    // Check if user is linked to a client record
    let clientId: string | undefined;
    if (user.role === 'client') {
      const client = await Client.findOne({ userId: user._id });
      if (client) {
        clientId = client._id.toString();
      }
    }

    user.lastLoginAt = new Date();
    await user.save();

    const payload: AuthUserPayload = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      clientId,
    };

    const token = jwt.sign(payload, ENV.JWT_SECRET, { expiresIn: ENV.JWT_EXPIRES_IN as any });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        clientId,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        clientId: req.user.clientId,
      },
    });
  } catch (error) {
    next(error);
  }
};
