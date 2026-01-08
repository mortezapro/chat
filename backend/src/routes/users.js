import express from 'express';
import mongoose from 'mongoose';
import { authenticate } from '../middleware/auth.js';
import User from '../models/User.js';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';

const router = express.Router();

// Search users - باید قبل از /:id باشد
router.get('/search', authenticate, async (req, res, next) => {
  try {
    const { q } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({ success: true, users: [] });
    }

    const currentUser = await User.findById(req.user._id);
    const blockedUserIds = currentUser.blockedUsers || [];

    const users = await User.find({
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { firstName: { $regex: q, $options: 'i' } },
        { lastName: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ],
      _id: { $ne: req.user._id, $nin: blockedUserIds }
    })
      .select('username firstName lastName avatar email isOnline lastSeen')
      .limit(20);

    res.json({ success: true, users });
  } catch (error) {
    next(error);
  }
});

// Block user
router.post('/:id/block', authenticate, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const targetUserId = req.params.id;

    if (user._id.toString() === targetUserId) {
      return res.status(400).json({ message: 'نمی‌توانید خود را مسدود کنید' });
    }

    if (!user.blockedUsers.includes(targetUserId)) {
      user.blockedUsers.push(targetUserId);
      await user.save();
    }

    res.json({ success: true, message: 'کاربر مسدود شد' });
  } catch (error) {
    next(error);
  }
});

// Unblock user
router.post('/:id/unblock', authenticate, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const targetUserId = req.params.id;

    user.blockedUsers = user.blockedUsers.filter(
      id => id.toString() !== targetUserId
    );
    await user.save();

    res.json({ success: true, message: 'کاربر از مسدودی خارج شد' });
  } catch (error) {
    next(error);
  }
});


// Add contact
router.post('/:id/contact', authenticate, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const targetUserId = req.params.id;

    if (user._id.toString() === targetUserId) {
      return res.status(400).json({ message: 'نمی‌توانید خود را به مخاطبین اضافه کنید' });
    }

    const existingContact = user.contacts?.find(
      c => c.user.toString() === targetUserId
    );

    if (!existingContact) {
      if (!user.contacts) {
        user.contacts = [];
      }
      user.contacts.push({
        user: targetUserId,
        addedAt: new Date()
      });
      await user.save();
    }

    res.json({ success: true, message: 'به مخاطبین اضافه شد' });
  } catch (error) {
    next(error);
  }
});

// Remove contact
router.delete('/:id/contact', authenticate, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const targetUserId = req.params.id;

    user.contacts = user.contacts?.filter(
      c => c.user.toString() !== targetUserId
    ) || [];
    await user.save();

    res.json({ success: true, message: 'از مخاطبین حذف شد' });
  } catch (error) {
    next(error);
  }
});

// Get contacts - باید قبل از /:id باشد
router.get('/contacts/list', authenticate, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('contacts.user', 'username firstName lastName avatar isOnline lastSeen');
    
    res.json({ success: true, contacts: user.contacts || [] });
  } catch (error) {
    next(error);
  }
});

// Get blocked users - باید قبل از /:id باشد
router.get('/blocked/list', authenticate, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('blockedUsers', 'username firstName lastName avatar');
    
    res.json({ success: true, blockedUsers: user.blockedUsers || [] });
  } catch (error) {
    next(error);
  }
});

// Update user profile - باید قبل از /:id باشد
router.put('/profile', authenticate, async (req, res, next) => {
  try {
    console.log('[PUT /users/profile] Request received:', {
      userId: req.user._id,
      body: req.body
    });
    
    const user = await User.findById(req.user._id);
    if (!user) {
      console.error('[PUT /users/profile] User not found:', req.user._id);
      return res.status(404).json({ success: false, message: 'کاربر یافت نشد' });
    }
    
    const { avatar, firstName, lastName, bio, phoneNumber, location, website } = req.body;
    
    const updates = {};
    if (avatar !== undefined) {
      console.log('[PUT /users/profile] Updating avatar:', {
        old: user.avatar,
        new: avatar
      });
      user.avatar = avatar;
      updates.avatar = avatar;
    }
    if (firstName !== undefined) {
      user.firstName = firstName;
      updates.firstName = firstName;
    }
    if (lastName !== undefined) {
      user.lastName = lastName;
      updates.lastName = lastName;
    }
    if (bio !== undefined) {
      user.bio = bio;
      updates.bio = bio;
    }
    if (phoneNumber !== undefined) {
      user.phoneNumber = phoneNumber;
      updates.phoneNumber = phoneNumber;
    }
    if (location !== undefined) {
      user.location = location;
      updates.location = location;
    }
    if (website !== undefined) {
      user.website = website;
      updates.website = website;
    }

    console.log('[PUT /users/profile] Saving user with updates:', updates);
    await user.save();
    
    const userResponse = user.toObject();
    console.log('[PUT /users/profile] User saved successfully:', {
      id: userResponse._id,
      avatar: userResponse.avatar,
      hasAvatar: !!userResponse.avatar
    });
    
    res.json({ success: true, user: userResponse });
  } catch (error) {
    console.error('[PUT /users/profile] Error:', error);
    next(error);
  }
});

// Get shared chats with a user - باید قبل از /:id باشد
router.get('/:id/shared-chats', authenticate, async (req, res, next) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user._id;

    if (!targetUserId || targetUserId === 'undefined') {
      return res.status(400).json({ success: false, message: 'شناسه کاربر معتبر نیست' });
    }

    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      return res.status(400).json({ success: false, message: 'شناسه کاربر نامعتبر است' });
    }

    const sharedChats = await Chat.find({
      type: { $in: ['group', 'channel'] },
      participants: { $all: [currentUserId, targetUserId] }
    })
      .populate('participants', 'username firstName lastName avatar')
      .populate('createdBy', 'username firstName lastName')
      .sort({ lastMessageAt: -1 });

    res.json({ success: true, chats: sharedChats });
  } catch (error) {
    next(error);
  }
});

// Get shared media with a user - باید قبل از /:id باشد
router.get('/:id/shared-media', authenticate, async (req, res, next) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user._id;

    if (!targetUserId || targetUserId === 'undefined') {
      return res.status(400).json({ success: false, message: 'شناسه کاربر معتبر نیست' });
    }

    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      return res.status(400).json({ success: false, message: 'شناسه کاربر نامعتبر است' });
    }

    // Find all chats between current user and target user
    const chats = await Chat.find({
      participants: { $all: [currentUserId, targetUserId] }
    }).select('_id');

    const chatIds = chats.map(chat => chat._id);

    if (chatIds.length === 0) {
      return res.json({ success: true, media: [] });
    }

    // Find all media messages in these chats
    const mediaMessages = await Message.find({
      chat: { $in: chatIds },
      type: { $in: ['image', 'video', 'file', 'audio'] },
      media: { $exists: true, $ne: null },
      isDeleted: false
    })
      .populate('sender', 'username firstName lastName avatar')
      .populate('chat', 'name type')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ success: true, media: mediaMessages });
  } catch (error) {
    next(error);
  }
});

// Get user profile - باید بعد از route های خاص باشد
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const userId = req.params.id;
    
    if (!userId || userId === 'undefined') {
      return res.status(400).json({ success: false, message: 'شناسه کاربر معتبر نیست' });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: 'شناسه کاربر نامعتبر است' });
    }

    const user = await User.findById(userId)
      .select('-password -blockedUsers');
    
    if (!user) {
      return res.status(404).json({ message: 'کاربر یافت نشد' });
    }

    // Check if user is blocked
    const currentUser = await User.findById(req.user._id);
    const isBlocked = currentUser.blockedUsers?.some(
      id => id.toString() === user._id.toString()
    ) || user.blockedUsers?.some(
      id => id.toString() === req.user._id.toString()
    );

    if (isBlocked) {
      return res.status(403).json({ message: 'این کاربر شما را مسدود کرده است' });
    }

    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
});

router.put('/privacy', authenticate, async (req, res, next) => {
  try {
    const { showLastSeen, showOnlineStatus, allowGroupInvites } = req.body;
    const user = await User.findById(req.user._id);

    if (!user.privacySettings) {
      user.privacySettings = {};
    }

    if (showLastSeen !== undefined) {
      user.privacySettings.showLastSeen = showLastSeen;
    }
    if (showOnlineStatus !== undefined) {
      user.privacySettings.showOnlineStatus = showOnlineStatus;
    }
    if (allowGroupInvites !== undefined) {
      user.privacySettings.allowGroupInvites = allowGroupInvites;
    }

    await user.save();
    res.json({ success: true, privacySettings: user.privacySettings });
  } catch (error) {
    next(error);
  }
});

router.put('/preferences', authenticate, async (req, res, next) => {
  try {
    const { fontFamily, fontSize, focusMode, theme, primaryColor, chatBackground } = req.body;
    const user = await User.findById(req.user._id);

    if (!user.preferences) {
      user.preferences = {};
    }

    if (fontFamily !== undefined) {
      user.preferences.fontFamily = fontFamily;
    }
    if (fontSize !== undefined) {
      user.preferences.fontSize = fontSize;
    }
    if (focusMode !== undefined) {
      user.preferences.focusMode = focusMode;
    }
    if (theme !== undefined) {
      user.preferences.theme = theme;
    }
    if (primaryColor !== undefined) {
      user.preferences.primaryColor = primaryColor;
    }
    if (chatBackground !== undefined) {
      user.preferences.chatBackground = chatBackground;
    }

    await user.save();
    res.json({ success: true, preferences: user.preferences });
  } catch (error) {
    next(error);
  }
});

export default router;
