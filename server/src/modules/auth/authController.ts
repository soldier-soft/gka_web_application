import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '../../models/User';
import { Client } from '../../models/Client';
import { ENV } from '../../config/env';
import { AuthUserPayload } from '../../middleware/auth';
import { OFFICIAL_CREDENTIALS } from './defaultCredentials';

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required.' });
      return;
    }

    const cleanEmail = email.toLowerCase().trim();
    const officialCred = OFFICIAL_CREDENTIALS.find(
      (c) => c.email.toLowerCase() === cleanEmail
    );

    let user: any = null;
    let dbQueryOk = true;

    try {
      user = await User.findOne({ email: cleanEmail });
    } catch (dbErr: any) {
      console.warn('[Auth DB Warning] Database query error:', dbErr.message);
      dbQueryOk = false;
    }

    // 1. If user record is missing in DB, but matches official credential
    if (!user && officialCred) {
      if (officialCred.password !== password) {
        res.status(401).json({ success: false, message: 'Invalid credentials.' });
        return;
      }

      // Auto-provision user into MongoDB if database is accessible
      if (dbQueryOk) {
        try {
          const salt = await bcrypt.genSalt(10);
          const passwordHash = await bcrypt.hash(officialCred.password, salt);
          user = await User.create({
            name: officialCred.name,
            email: officialCred.email,
            phone: officialCred.phone,
            passwordHash,
            defaultPassword: officialCred.password,
            role: officialCred.role,
            isActive: true,
          });

          if (officialCred.role === 'client') {
            const client = await Client.create({
              userId: user._id,
              name: officialCred.name,
              companyName: officialCred.companyName || officialCred.name,
              email: officialCred.email,
              phone: officialCred.phone,
              billingAddress: {
                street: 'Ginger Hotel, Rajiv Gandhi Salai (OMR), Navalur',
                city: 'Chennai',
                state: 'Tamil Nadu',
                pincode: '600130',
              },
            });
            user.clientId = client._id;
            await user.save();
          }
          console.log(`[Auth Provisioning] Auto-provisioned missing user on login: ${officialCred.email}`);
        } catch (provErr: any) {
          console.warn('[Auth Provisioning Warning]:', provErr.message);
        }
      }
    }

    // 2. If user exists in MongoDB
    if (user) {
      if (!user.isActive) {
        if (officialCred) {
          user.isActive = true;
          await user.save();
        } else {
          res.status(401).json({ success: false, message: 'Invalid credentials or inactive account.' });
          return;
        }
      }

      let isMatch = await user.comparePassword(password);
      if (!isMatch && officialCred && officialCred.password === password) {
        // Password in DB was out of date with credential file; update it automatically
        const salt = await bcrypt.genSalt(10);
        user.passwordHash = await bcrypt.hash(officialCred.password, salt);
        await user.save();
        isMatch = true;
      }

      if (!isMatch) {
        res.status(401).json({ success: false, message: 'Invalid credentials.' });
        return;
      }

      // Check if user is linked to a client record
      let clientId: string | undefined = user.clientId?.toString();
      if (!clientId && user.role === 'client') {
        const client = await Client.findOne({ userId: user._id });
        if (client) {
          clientId = client._id.toString();
        }
      }

      try {
        user.lastLoginAt = new Date();
        await user.save();
      } catch {}

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
      return;
    }

    // 3. Fallback: If MongoDB is offline or query failed, but official credentials match
    if (officialCred) {
      if (officialCred.password !== password) {
        res.status(401).json({ success: false, message: 'Invalid credentials.' });
        return;
      }

      const payload: AuthUserPayload = {
        id: `official-${officialCred.role}`,
        name: officialCred.name,
        email: officialCred.email,
        role: officialCred.role,
        clientId: officialCred.role === 'client' ? 'client-official-001' : undefined,
      };

      const token = jwt.sign(payload, ENV.JWT_SECRET, { expiresIn: ENV.JWT_EXPIRES_IN as any });

      res.json({
        success: true,
        token,
        user: {
          id: `official-${officialCred.role}`,
          name: officialCred.name,
          email: officialCred.email,
          phone: officialCred.phone,
          role: officialCred.role,
          clientId: officialCred.role === 'client' ? 'client-official-001' : undefined,
        },
      });
      return;
    }

    // Default rejection for invalid user
    res.status(401).json({ success: false, message: 'Invalid credentials or inactive account.' });
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

    let user: any = null;
    try {
      if (!req.user.id.startsWith('official-')) {
        user = await User.findById(req.user.id).select('-passwordHash');
      }
    } catch {}

    if (!user) {
      const official = OFFICIAL_CREDENTIALS.find(
        (c) => c.email.toLowerCase() === req.user?.email.toLowerCase()
      );
      if (official) {
        res.json({
          success: true,
          user: {
            id: req.user.id,
            name: official.name,
            email: official.email,
            phone: official.phone,
            role: official.role,
            clientId: req.user.clientId,
          },
        });
        return;
      }
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

