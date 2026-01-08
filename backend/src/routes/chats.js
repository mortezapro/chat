import express from 'express';
import { authenticate } from '../middleware/auth.js';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';

const router = express.Router();

router.get('/', authenticate, async (req, res, next) => {
  try {
    const { activityFilter } = req.query;
    let sortQuery = { lastMessageAt: -1 };

    if (activityFilter === 'high') {
      sortQuery = { activityLevel: -1, lastMessageAt: -1 };
    } else if (activityFilter === 'low') {
      sortQuery = { activityLevel: 1, lastMessageAt: -1 };
    }

    const chats = await Chat.find({
      participants: req.user._id,
      isArchived: false
    })
      .populate('participants', 'username firstName lastName avatar isOnline')
      .populate('lastMessage')
      .populate('createdBy', 'username firstName lastName')
      .sort(sortQuery);

    // Calculate unread count for each chat
    const chatsWithUnread = await Promise.all(chats.map(async (chat) => {
      const lastRead = chat.lastReadBy?.find(lr => lr.user.toString() === req.user._id.toString());
      const lastReadMessage = lastRead?.lastReadMessage;

      let unreadCount = 0;
      if (chat.lastMessage && chat.lastMessage.sender?.toString() !== req.user._id.toString()) {
        if (!lastReadMessage) {
          // Count all messages not sent by user
          unreadCount = await Message.countDocuments({
            chat: chat._id,
            isDeleted: false,
            sender: { $ne: req.user._id }
          });
        } else {
          // Count messages after last read
          const lastReadMsg = await Message.findById(lastReadMessage);
          if (lastReadMsg) {
            unreadCount = await Message.countDocuments({
              chat: chat._id,
              isDeleted: false,
              sender: { $ne: req.user._id },
              createdAt: { $gt: lastReadMsg.createdAt }
            });
          }
        }
      }

      return {
        ...chat.toObject(),
        unreadCount
      };
    }));

    res.json({ success: true, chats: chatsWithUnread });
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticate, async (req, res, next) => {
  try {
    const { type, participants, name, description } = req.body;

    if (type === 'private' && participants.length !== 1) {
      return res.status(400).json({ message: 'چت خصوصی باید دقیقاً یک شرکت‌کننده داشته باشد' });
    }

    const chatParticipants = [req.user._id, ...participants];
    const chat = new Chat({
      type,
      participants: chatParticipants,
      name,
      description,
      createdBy: req.user._id,
      admins: type !== 'private' ? [req.user._id] : []
    });

    await chat.save();
    await chat.populate('participants', 'username firstName lastName avatar isOnline');

    res.status(201).json({ success: true, chat });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/pinned-messages', authenticate, async (req, res, next) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.id,
      participants: req.user._id
    });

    if (!chat) {
      return res.status(404).json({ message: 'چت یافت نشد' });
    }

    const pinnedMessageIds = chat.settings?.pinnedMessages || [];
    const messages = await Message.find({
      _id: { $in: pinnedMessageIds },
      isDeleted: false
    })
      .populate('sender', 'username firstName lastName avatar')
      .populate('replyTo')
      .populate('pinnedBy', 'username firstName lastName')
      .sort({ pinnedAt: -1 });

    res.json({ success: true, messages });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.id,
      participants: req.user._id
    })
      .populate('participants', 'username firstName lastName avatar isOnline')
      .populate('createdBy', 'username firstName lastName')
      .populate('admins', 'username firstName lastName');

    if (!chat) {
      return res.status(404).json({ message: 'چت یافت نشد' });
    }

    res.json({ success: true, chat });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.id,
      participants: req.user._id
    });

    if (!chat) {
      return res.status(404).json({ message: 'چت یافت نشد' });
    }

    if (chat.type !== 'private' && chat.admins.includes(req.user._id)) {
      const { name, description, avatar, selfDestructEnabled, selfDestructDelay, securitySettings } = req.body;
      if (name) chat.name = name;
      if (description !== undefined) chat.description = description;
      if (avatar !== undefined) chat.avatar = avatar;
      if (selfDestructEnabled !== undefined) {
        chat.settings.selfDestructEnabled = selfDestructEnabled;
      }
      if (selfDestructDelay !== undefined) {
        chat.settings.selfDestructDelay = selfDestructDelay;
      }
      if (securitySettings) {
        chat.settings.securitySettings = {
          ...chat.settings.securitySettings,
          ...securitySettings
        };
      }

      await chat.save();
      await chat.populate('participants', 'username firstName lastName avatar isOnline');
      await chat.populate('admins', 'username firstName lastName');
    }

    res.json({ success: true, chat });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/members', authenticate, async (req, res, next) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.id,
      participants: req.user._id
    });

    if (!chat) {
      return res.status(404).json({ message: 'چت یافت نشد' });
    }

    if (chat.type === 'private') {
      return res.status(400).json({ message: 'نمی‌توان به چت خصوصی عضو اضافه کرد' });
    }

    if (!chat.admins.includes(req.user._id)) {
      return res.status(403).json({ message: 'فقط مدیران می‌توانند عضو اضافه کنند' });
    }

    const { userId } = req.body;
    if (!chat.participants.includes(userId)) {
      chat.participants.push(userId);
      await chat.save();
    }

    await chat.populate('participants', 'username firstName lastName avatar isOnline');

    res.json({ success: true, chat });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id/members/:userId', authenticate, async (req, res, next) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.id,
      participants: req.user._id
    });

    if (!chat) {
      return res.status(404).json({ message: 'چت یافت نشد' });
    }

    if (chat.type === 'private') {
      return res.status(400).json({ message: 'نمی‌توان از چت خصوصی عضو حذف کرد' });
    }

    if (!chat.admins.includes(req.user._id)) {
      return res.status(403).json({ message: 'فقط مدیران می‌توانند عضو حذف کنند' });
    }

    const { userId } = req.params;
    chat.participants = chat.participants.filter(
      (p) => p.toString() !== userId
    );

    if (chat.admins.includes(userId)) {
      chat.admins = chat.admins.filter((a) => a.toString() !== userId);
    }

    await chat.save();
    await chat.populate('participants', 'username firstName lastName avatar isOnline');

    res.json({ success: true, chat });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/admins', authenticate, async (req, res, next) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.id,
      participants: req.user._id
    });

    if (!chat) {
      return res.status(404).json({ message: 'چت یافت نشد' });
    }

    if (chat.type === 'private') {
      return res.status(400).json({ message: 'چت خصوصی ادمین ندارد' });
    }

    if (!chat.admins.includes(req.user._id)) {
      return res.status(403).json({ message: 'فقط مدیران می‌توانند ادمین اضافه کنند' });
    }

    const { userId } = req.body;
    if (!chat.participants.includes(userId)) {
      return res.status(400).json({ message: 'کاربر عضو گروه نیست' });
    }

    if (!chat.admins.includes(userId)) {
      chat.admins.push(userId);
      await chat.save();
    }

    await chat.populate('admins', 'username firstName lastName avatar');

    res.json({ success: true, chat });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id/admins/:userId', authenticate, async (req, res, next) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.id,
      participants: req.user._id
    });

    if (!chat) {
      return res.status(404).json({ message: 'چت یافت نشد' });
    }

    if (chat.type === 'private') {
      return res.status(400).json({ message: 'چت خصوصی ادمین ندارد' });
    }

    if (!chat.admins.includes(req.user._id)) {
      return res.status(403).json({ message: 'فقط مدیران می‌توانند ادمین حذف کنند' });
    }

    const { userId } = req.params;

    if (chat.admins.length === 1) {
      return res.status(400).json({ message: 'گروه باید حداقل یک ادمین داشته باشد' });
    }

    chat.admins = chat.admins.filter((a) => a.toString() !== userId);
    await chat.save();
    await chat.populate('admins', 'username firstName lastName avatar');

    res.json({ success: true, chat });
  } catch (error) {
    next(error);
  }
});

// Archive chat
router.post('/:id/archive', authenticate, async (req, res, next) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.id,
      participants: req.user._id
    });

    if (!chat) {
      return res.status(404).json({ message: 'چت یافت نشد' });
    }

    chat.isArchived = true;
    await chat.save();

    res.json({ success: true, chat });
  } catch (error) {
    next(error);
  }
});

// Unarchive chat
router.post('/:id/unarchive', authenticate, async (req, res, next) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.id,
      participants: req.user._id
    });

    if (!chat) {
      return res.status(404).json({ message: 'چت یافت نشد' });
    }

    chat.isArchived = false;
    await chat.save();

    res.json({ success: true, chat });
  } catch (error) {
    next(error);
  }
});

// Mute chat
router.post('/:id/mute', authenticate, async (req, res, next) => {
  try {
    const { duration } = req.body; // in hours, null for forever
    const chat = await Chat.findOne({
      _id: req.params.id,
      participants: req.user._id
    });

    if (!chat) {
      return res.status(404).json({ message: 'چت یافت نشد' });
    }

    const mutedUntil = duration
      ? new Date(Date.now() + duration * 60 * 60 * 1000)
      : new Date('2099-12-31');

    const existingMute = chat.mutedBy?.find(
      m => m.user.toString() === req.user._id.toString()
    );

    if (existingMute) {
      existingMute.mutedUntil = mutedUntil;
    } else {
      if (!chat.mutedBy) {
        chat.mutedBy = [];
      }
      chat.mutedBy.push({
        user: req.user._id,
        mutedUntil
      });
    }

    await chat.save();
    res.json({ success: true, chat });
  } catch (error) {
    next(error);
  }
});

// Unmute chat
router.post('/:id/unmute', authenticate, async (req, res, next) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.id,
      participants: req.user._id
    });

    if (!chat) {
      return res.status(404).json({ message: 'چت یافت نشد' });
    }

    chat.mutedBy = chat.mutedBy?.filter(
      m => m.user.toString() !== req.user._id.toString()
    ) || [];

    await chat.save();
    res.json({ success: true, chat });
  } catch (error) {
    next(error);
  }
});

// Generate invite link
router.post('/:id/invite-link', authenticate, async (req, res, next) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.id,
      participants: req.user._id
    });

    if (!chat) {
      return res.status(404).json({ message: 'چت یافت نشد' });
    }

    if (chat.type !== 'group') {
      return res.status(400).json({ message: 'فقط برای گروه‌ها امکان‌پذیر است' });
    }

    if (!chat.admins.includes(req.user._id)) {
      return res.status(403).json({ message: 'فقط مدیران می‌توانند لینک دعوت ایجاد کنند' });
    }

    const { expiresIn, maxUses } = req.body; // expiresIn in hours
    const code = Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);

    chat.inviteLink = {
      code,
      expiresAt: expiresIn
        ? new Date(Date.now() + expiresIn * 60 * 60 * 1000)
        : null,
      maxUses: maxUses || null,
      currentUses: 0,
      isActive: true
    };

    await chat.save();

    const inviteUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/join/${code}`;

    res.json({ success: true, inviteLink: inviteUrl, code });
  } catch (error) {
    next(error);
  }
});

// Join via invite link
router.post('/join/:code', authenticate, async (req, res, next) => {
  try {
    const chat = await Chat.findOne({
      'inviteLink.code': req.params.code,
      'inviteLink.isActive': true
    });

    if (!chat) {
      return res.status(404).json({ message: 'لینک دعوت نامعتبر است' });
    }

    // Check expiration
    if (chat.inviteLink.expiresAt && chat.inviteLink.expiresAt < new Date()) {
      return res.status(400).json({ message: 'لینک دعوت منقضی شده است' });
    }

    // Check max uses
    if (chat.inviteLink.maxUses &&
      chat.inviteLink.currentUses >= chat.inviteLink.maxUses) {
      return res.status(400).json({ message: 'حد مجاز استفاده از لینک تمام شده است' });
    }

    // Check if already a participant
    if (chat.participants.includes(req.user._id)) {
      return res.status(400).json({ message: 'شما قبلاً عضو این گروه هستید' });
    }

    // Add user to group
    chat.participants.push(req.user._id);
    chat.inviteLink.currentUses += 1;
    await chat.save();
    await chat.populate('participants', 'username firstName lastName avatar isOnline');

    const io = req.app.get('io');
    if (io) {
      io.to(`chat:${chat._id}`).emit('chat:member-added', {
        chatId: chat._id,
        userId: req.user._id,
        user: req.user
      });
    }

    res.json({ success: true, chat });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/summary', authenticate, async (req, res, next) => {
  try {
    const { content, messageIds } = req.body;
    const chat = await Chat.findOne({
      _id: req.params.id,
      participants: req.user._id
    });

    if (!chat) {
      return res.status(404).json({ message: 'چت یافت نشد' });
    }

    const summary = {
      createdBy: req.user._id,
      content,
      messageIds: messageIds || [],
      isPinned: false,
      createdAt: new Date()
    };

    if (!chat.summaries) {
      chat.summaries = [];
    }
    chat.summaries.push(summary);
    await chat.save();

    res.json({ success: true, summary });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/summary/:summaryId/pin', authenticate, async (req, res, next) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.id,
      participants: req.user._id
    });

    if (!chat) {
      return res.status(404).json({ message: 'چت یافت نشد' });
    }

    const summary = chat.summaries.id(req.params.summaryId);
    if (!summary) {
      return res.status(404).json({ message: 'خلاصه یافت نشد' });
    }

    summary.isPinned = !summary.isPinned;
    await chat.save();

    res.json({ success: true, summary });
  } catch (error) {
    next(error);
  }
});

router.put('/:id/settings', authenticate, async (req, res, next) => {
  try {
    const { autoDownload, fontFamily, fontSize } = req.body;
    const chat = await Chat.findOne({
      _id: req.params.id,
      participants: req.user._id
    });

    if (!chat) {
      return res.status(404).json({ message: 'چت یافت نشد' });
    }

    if (!chat.userSettings) {
      chat.userSettings = [];
    }

    const existingSettings = chat.userSettings.find(
      s => s.user.toString() === req.user._id.toString()
    );

    if (existingSettings) {
      if (autoDownload !== undefined) existingSettings.autoDownload = autoDownload;
      if (fontFamily !== undefined) existingSettings.fontFamily = fontFamily;
      if (fontSize !== undefined) existingSettings.fontSize = fontSize;
    } else {
      chat.userSettings.push({
        user: req.user._id,
        autoDownload: autoDownload !== undefined ? autoDownload : true,
        fontFamily: fontFamily || null,
        fontSize: fontSize || null
      });
    }

    await chat.save();
    res.json({ success: true, settings: chat.userSettings.find(s => s.user.toString() === req.user._id.toString()) });
  } catch (error) {
    next(error);
  }
});

router.get('/search/advanced', authenticate, async (req, res, next) => {
  try {
    const { chatId, query, type, senderId, tags, onlyMyMessages, dateFrom, dateTo } = req.query;

    let searchQuery = {
      isDeleted: false
    };

    if (chatId) {
      const chat = await Chat.findOne({
        _id: chatId,
        participants: req.user._id
      });
      if (!chat) {
        return res.status(404).json({ message: 'چت یافت نشد' });
      }
      searchQuery.chat = chatId;
    } else {
      const userChats = await Chat.find({ participants: req.user._id }).select('_id');
      searchQuery.chat = { $in: userChats.map(c => c._id) };
    }

    if (onlyMyMessages === 'true') {
      searchQuery.sender = req.user._id;
    }

    if (senderId) {
      searchQuery.sender = senderId;
    }

    if (type) {
      searchQuery.type = type;
    }

    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      searchQuery.tags = { $in: tagArray };
    }

    if (query) {
      searchQuery.$or = [
        { content: { $regex: query, $options: 'i' } },
        { 'linkPreview.title': { $regex: query, $options: 'i' } },
        { 'linkPreview.description': { $regex: query, $options: 'i' } }
      ];
    }

    if (dateFrom || dateTo) {
      searchQuery.createdAt = {};
      if (dateFrom) searchQuery.createdAt.$gte = new Date(dateFrom);
      if (dateTo) searchQuery.createdAt.$lte = new Date(dateTo);
    }

    const messages = await Message.find(searchQuery)
      .populate('sender', 'username firstName lastName avatar')
      .populate('chat', 'name type')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ success: true, messages });
  } catch (error) {
    next(error);
  }
});

// Get files in a chat
router.get('/:id/files', authenticate, async (req, res, next) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.id,
      participants: req.user._id
    });

    if (!chat) {
      return res.status(404).json({ message: 'چت یافت نشد' });
    }

    const messages = await Message.find({
      chat: req.params.id,
      type: { $in: ['file', 'image', 'video', 'audio'] },
      isDeleted: false
    })
      .populate('sender', 'username firstName lastName avatar')
      .sort({ createdAt: -1 })
      .limit(1000);

    const files = messages
      .filter(msg => msg.media?.url)
      .map(msg => ({
        _id: msg._id,
        name: msg.media?.name || msg.content || 'فایل بدون نام',
        url: msg.media.url,
        mimeType: msg.media.mimeType,
        size: msg.media.size,
        type: msg.type,
        message: {
          _id: msg._id,
          content: msg.content,
          createdAt: msg.createdAt,
          sender: msg.sender
        }
      }));

    res.json({ success: true, files });
  } catch (error) {
    next(error);
  }
});

export default router;

