import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Register
router.post('/register', async (req, res, next) => {
  try {
    const { username, email, password, firstName, lastName } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'لطفاً تمام فیلدهای الزامی را پر کنید' });
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({ message: 'کاربری با این ایمیل یا نام کاربری وجود دارد' });
    }

    const user = new User({
      username,
      email,
      password,
      firstName,
      lastName
    });

    await user.save();

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar
      }
    });
  } catch (error) {
    next(error);
  }
});

// Login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'لطفاً ایمیل و رمز عبور را وارد کنید' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: 'ایمیل یا رمز عبور اشتباه است' });
    }

    const isValidPassword = await user.comparePassword(password);

    if (!isValidPassword) {
      return res.status(401).json({ message: 'ایمیل یا رمز عبور اشتباه است' });
    }

    // Check 2FA if enabled
    if (user.twoFactorAuth?.enabled) {
      return res.status(200).json({
        success: true,
        requires2FA: true,
        userId: user._id
      });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    user.isOnline = true;
    user.lastSeen = new Date();
    await user.save();

    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar
      }
    });
  } catch (error) {
    next(error);
  }
});

// Verify 2FA and login
router.post('/login/2fa', async (req, res, next) => {
  try {
    const { userId, token, backupCode } = req.body;
    const user = await User.findById(userId);

    if (!user || !user.twoFactorAuth?.enabled) {
      return res.status(400).json({ message: 'احراز هویت دو مرحله‌ای فعال نیست' });
    }

    let verified = false;

    if (backupCode) {
      verified = user.twoFactorAuth.backupCodes?.includes(backupCode);
      if (verified) {
        user.twoFactorAuth.backupCodes = user.twoFactorAuth.backupCodes.filter(c => c !== backupCode);
        await user.save();
      }
    } else if (token) {
      const speakeasy = (await import('speakeasy')).default;
      verified = speakeasy.totp.verify({
        secret: user.twoFactorAuth.secret,
        encoding: 'base32',
        token,
        window: 2
      });
    }

    if (!verified) {
      return res.status(401).json({ message: 'کد نامعتبر است' });
    }

    const jwtToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    user.isOnline = true;
    user.lastSeen = new Date();
    await user.save();

    res.json({
      success: true,
      token: jwtToken,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar
      }
    });
  } catch (error) {
    next(error);
  }
});

// Enable 2FA
router.post('/2fa/enable', authenticate, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    
    const speakeasy = (await import('speakeasy')).default;
    const QRCode = (await import('qrcode')).default;
    
    const secret = speakeasy.generateSecret({
      name: `Chat App (${user.email})`,
      issuer: 'Chat App'
    });

    if (!user.twoFactorAuth) {
      user.twoFactorAuth = {};
    }
    user.twoFactorAuth.secret = secret.base32;
    await user.save();

    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    res.json({
      success: true,
      secret: secret.base32,
      qrCode: qrCodeUrl
    });
  } catch (error) {
    next(error);
  }
});

// Verify and enable 2FA
router.post('/2fa/verify', authenticate, async (req, res, next) => {
  try {
    const { token } = req.body;
    const user = await User.findById(req.user._id);

    const speakeasy = (await import('speakeasy')).default;
    if (!user.twoFactorAuth?.secret) {
      return res.status(400).json({ message: 'ابتدا باید 2FA را فعال کنید' });
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorAuth.secret,
      encoding: 'base32',
      token,
      window: 2
    });

    if (verified) {
      if (!user.twoFactorAuth) {
        user.twoFactorAuth = {};
      }
      user.twoFactorAuth.enabled = true;
      user.twoFactorAuth.verifiedAt = new Date();
      
      // Generate backup codes
      const backupCodes = Array.from({ length: 10 }, () => 
        Math.random().toString(36).substring(2, 10).toUpperCase()
      );
      user.twoFactorAuth.backupCodes = backupCodes;
      
      await user.save();

      res.json({
        success: true,
        backupCodes,
        message: 'احراز هویت دو مرحله‌ای فعال شد'
      });
    } else {
      res.status(400).json({ message: 'کد نامعتبر است' });
    }
  } catch (error) {
    next(error);
  }
});

// Disable 2FA
router.post('/2fa/disable', authenticate, async (req, res, next) => {
  try {
    const { password } = req.body;
    const user = await User.findById(req.user._id);

    const isValid = await user.comparePassword(password);
    if (!isValid) {
      return res.status(401).json({ message: 'رمز عبور اشتباه است' });
    }

    if (!user.twoFactorAuth) {
      user.twoFactorAuth = {};
    }
    user.twoFactorAuth.enabled = false;
    user.twoFactorAuth.secret = null;
    user.twoFactorAuth.backupCodes = [];
    await user.save();

    res.json({ success: true, message: 'احراز هویت دو مرحله‌ای غیرفعال شد' });
  } catch (error) {
    next(error);
  }
});

export default router;
