import express from 'express';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Enable 2FA
router.post('/enable', authenticate, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    
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
router.post('/verify', authenticate, async (req, res, next) => {
  try {
    const { token } = req.body;
    const user = await User.findById(req.user._id);

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
router.post('/disable', authenticate, async (req, res, next) => {
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







