import express from 'express';
import { authenticate } from '../middleware/auth.js';
import Message from '../models/Message.js';
import Chat from '../models/Chat.js';
import { fetchLinkPreview } from '../utils/linkPreview.js';
import { parseMentions, notifyMentions } from '../utils/mentions.js';

const router = express.Router();

router.get('/:chatId', authenticate, async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const chat = await Chat.findOne({
      _id: chatId,
      participants: req.user._id
    });

    if (!chat) {
      return res.status(404).json({ message: 'چت یافت نشد' });
    }

    const messages = await Message.find({
      chat: chatId,
      isDeleted: false
    })
      .populate('sender', 'username firstName lastName avatar')
      .populate('replyTo')
      .populate('pinnedBy', 'username firstName lastName')
      .sort({ isPinned: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    res.json({
      success: true,
      messages: messages.reverse(),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: await Message.countDocuments({ chat: chatId, isDeleted: false })
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', authenticate, async (req, res, next) => {
  try {
    const { chatId, content, type, media, replyTo, linkPreview, selfDestruct, location, tags, isSilent, notificationDelay, scheduledAt } = req.body;

    const chat = await Chat.findOne({
      _id: chatId,
      participants: req.user._id
    });

    if (!chat) {
      return res.status(404).json({ message: 'چت یافت نشد' });
    }

    // Auto-detect links in content
    let detectedLinkPreview = linkPreview;
    if (content && !linkPreview) {
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const urls = content.match(urlRegex);
      if (urls && urls.length > 0) {
        try {
          detectedLinkPreview = await fetchLinkPreview(urls[0]);
        } catch (error) {
          console.error('Error fetching link preview:', error);
        }
      }
    }

    // Parse mentions
    const { mentions, isMentionAll } = await parseMentions(content, chatId);
    const quotedMessage = req.body.quotedMessage || null;

    const isScheduled = scheduledAt && new Date(scheduledAt) > new Date();
    
    const message = new Message({
      chat: chatId,
      sender: req.user._id,
      content,
      type: type || 'text',
      media: location ? {
        ...media,
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address
      } : media,
      replyTo,
      quotedMessage,
      linkPreview: detectedLinkPreview,
      tags: tags || [],
      isSilent: isSilent || false,
      notificationDelay: notificationDelay || null,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      isScheduled: isScheduled,
      mentions,
      isMentionAll
    });

    // Handle self-destruct
    if (selfDestruct?.enabled || chat.settings?.selfDestructEnabled) {
      const delay = selfDestruct?.delay || chat.settings?.selfDestructDelay || 30;
      message.selfDestruct = {
        enabled: true,
        delay: delay,
        destructAt: null,
        readBy: []
      };
    }

    await message.save();
    await message.populate('sender', 'username firstName lastName avatar');
    await message.populate('mentions', 'username firstName lastName avatar');
    if (replyTo) {
      await message.populate('replyTo');
    }
    if (quotedMessage) {
      await message.populate('quotedMessage');
      if (message.quotedMessage) {
        await message.populate('quotedMessage.sender', 'username firstName lastName avatar');
      }
    }

    if (!isScheduled) {
      chat.lastMessage = message._id;
      chat.lastMessageAt = new Date();
      await chat.save();

      const io = req.app.get('io');
      if (io) {
        await message.populate('reactions.user', 'username firstName lastName avatar');
        io.to(`chat:${chatId}`).emit('message:new', message);
        
        // Notify mentioned users
        if (mentions.length > 0 || isMentionAll) {
          await notifyMentions(message, chat, io);
        }
      }
    }

    res.status(201).json({ success: true, message });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const { content } = req.body;
    const message = await Message.findOne({
      _id: req.params.id,
      sender: req.user._id
    });

    if (!message) {
      return res.status(404).json({ message: 'پیام یافت نشد' });
    }

    if (message.isDeleted) {
      return res.status(400).json({ message: 'پیام حذف شده است' });
    }

    message.content = content;
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();
    await message.populate('sender', 'username firstName lastName avatar');

    res.json({ success: true, message });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/reminder', authenticate, async (req, res, next) => {
  try {
    const { remindAt, message: reminderMessage } = req.body;
    const message = await Message.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({ message: 'پیام یافت نشد' });
    }

    const chat = await Chat.findById(message.chat);
    if (!chat || !chat.participants.includes(req.user._id)) {
      return res.status(403).json({ message: 'شما عضو این چت نیستید' });
    }

    const reminder = {
      user: req.user._id,
      remindAt: new Date(remindAt),
      message: reminderMessage || '',
      isCompleted: false
    };

    message.reminders.push(reminder);
    await message.save();

    res.json({ success: true, reminder });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id/reminder/:reminderId', authenticate, async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({ message: 'پیام یافت نشد' });
    }

    message.reminders = message.reminders.filter(
      r => r._id.toString() !== req.params.reminderId && r.user.toString() === req.user._id.toString()
    );
    await message.save();

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/note', authenticate, async (req, res, next) => {
  try {
    const { note } = req.body;
    const message = await Message.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({ message: 'پیام یافت نشد' });
    }

    const existingNoteIndex = message.personalNotes.findIndex(
      n => n.user.toString() === req.user._id.toString()
    );

    if (existingNoteIndex >= 0) {
      message.personalNotes[existingNoteIndex].note = note;
      message.personalNotes[existingNoteIndex].createdAt = new Date();
    } else {
      message.personalNotes.push({
        user: req.user._id,
        note,
        createdAt: new Date()
      });
    }

    await message.save();

    res.json({ success: true, note: message.personalNotes.find(n => n.user.toString() === req.user._id.toString()) });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id/note', authenticate, async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({ message: 'پیام یافت نشد' });
    }

    message.personalNotes = message.personalNotes.filter(
      n => n.user.toString() !== req.user._id.toString()
    );
    await message.save();

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const { deleteForEveryone } = req.body;
    const message = await Message.findOne({
      _id: req.params.id,
      sender: req.user._id
    });

    if (!message) {
      return res.status(404).json({ message: 'پیام یافت نشد' });
    }

    const chat = await Chat.findById(message.chat);
    if (!chat) {
      return res.status(404).json({ message: 'چت یافت نشد' });
    }

    if (deleteForEveryone) {
      // Check permissions for group
      if (chat.type === 'group' && chat.settings?.securitySettings?.onlyAdminsCanDelete) {
        if (!chat.admins.includes(req.user._id)) {
          return res.status(403).json({ message: 'فقط مدیران می‌توانند پیام را برای همه حذف کنند' });
        }
      }

      message.isDeleted = true;
      message.deletedAt = new Date();
      message.content = 'این پیام حذف شده است';
      message.deletedFor = chat.participants.map(p => p.toString());
    } else {
      // Delete only for sender
      if (!message.deletedFor) {
        message.deletedFor = [];
      }
      message.deletedFor.push(req.user._id);
      
      // If deleted for all participants, mark as fully deleted
      if (message.deletedFor.length === chat.participants.length) {
        message.isDeleted = true;
        message.deletedAt = new Date();
        message.content = 'این پیام حذف شده است';
      }
    }

    await message.save();
    await message.populate('sender', 'username firstName lastName avatar');

    // Emit delete event via socket
    const io = req.app.get('io');
    if (io) {
      io.to(`chat:${chat._id}`).emit('message:deleted', {
        messageId: message._id,
        deletedForEveryone: deleteForEveryone
      });
    }

    res.json({ success: true, message });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/reaction', authenticate, async (req, res, next) => {
  try {
    const { emoji } = req.body;
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'پیام یافت نشد' });
    }

    const existingReaction = message.reactions.find(
      r => r.user.toString() === req.user._id.toString() && r.emoji === emoji
    );

    if (existingReaction) {
      message.reactions = message.reactions.filter(
        r => !(r.user.toString() === req.user._id.toString() && r.emoji === emoji)
      );
    } else {
      message.reactions.push({
        user: req.user._id,
        emoji
      });
    }

    await message.save();
    await message.populate('reactions.user', 'username firstName lastName avatar');

    const io = req.app.get('io');
    if (io) {
      const chat = await Chat.findById(message.chat);
      if (chat) {
        io.to(`chat:${chat._id}`).emit('message:updated', message);
      }
    }

    res.json({ success: true, message });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/pin', authenticate, async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ message: 'پیام یافت نشد' });
    }

    const chat = await Chat.findById(message.chat);
    if (!chat) {
      return res.status(404).json({ message: 'چت یافت نشد' });
    }

    if (!chat.participants.includes(req.user._id)) {
      return res.status(403).json({ message: 'شما عضو این چت نیستید' });
    }

    if (chat.type === 'group' && chat.settings?.securitySettings?.onlyAdminsCanPin) {
      if (!chat.admins.includes(req.user._id)) {
        return res.status(403).json({ message: 'فقط مدیران می‌توانند پیام پین کنند' });
      }
    }

    if (message.isPinned) {
      message.isPinned = false;
      message.pinnedAt = null;
      message.pinnedBy = null;
      chat.settings.pinnedMessages = chat.settings.pinnedMessages.filter(
        m => m.toString() !== message._id.toString()
      );
    } else {
      message.isPinned = true;
      message.pinnedAt = new Date();
      message.pinnedBy = req.user._id;
      if (!chat.settings.pinnedMessages) {
        chat.settings.pinnedMessages = [];
      }
      if (!chat.settings.pinnedMessages.includes(message._id)) {
        chat.settings.pinnedMessages.push(message._id);
      }
    }

    await message.save();
    await chat.save();
    await message.populate('pinnedBy', 'username firstName lastName');
    await message.populate('sender', 'username firstName lastName avatar');

    const io = req.app.get('io');
    if (io) {
      io.to(`chat:${chat._id}`).emit('message:pinned', { message, chatId: chat._id });
    }

    res.json({ success: true, message });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/save', authenticate, async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ message: 'پیام یافت نشد' });
    }

    const User = (await import('../models/User.js')).default;
    const user = await User.findById(req.user._id);

    if (!user.savedMessages.includes(message._id)) {
      user.savedMessages.push(message._id);
      await user.save();
    }

    res.json({ success: true, message: 'پیام ذخیره شد' });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id/save', authenticate, async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ message: 'پیام یافت نشد' });
    }

    const User = (await import('../models/User.js')).default;
    const user = await User.findById(req.user._id);

    user.savedMessages = user.savedMessages.filter(
      m => m.toString() !== message._id.toString()
    );
    await user.save();

    res.json({ success: true, message: 'پیام از ذخیره‌شده‌ها حذف شد' });
  } catch (error) {
    next(error);
  }
});

router.get('/saved/all', authenticate, async (req, res, next) => {
  try {
    const User = (await import('../models/User.js')).default;
    const user = await User.findById(req.user._id).populate({
      path: 'savedMessages',
      populate: [
        { path: 'sender', select: 'username firstName lastName avatar' },
        { path: 'chat', select: 'name type' },
        { path: 'replyTo', populate: { path: 'sender', select: 'username firstName lastName' } }
      ]
    });

    res.json({ success: true, messages: user.savedMessages || [] });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/view', authenticate, async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ message: 'پیام یافت نشد' });
    }

    const chat = await Chat.findById(message.chat);
    if (!chat || chat.type !== 'channel') {
      return res.status(400).json({ message: 'این قابلیت فقط برای کانال‌ها است' });
    }

    const existingView = message.views?.find(
      v => v.user.toString() === req.user._id.toString()
    );

    if (!existingView) {
      if (!message.views) {
        message.views = [];
      }
      message.views.push({
        user: req.user._id,
        viewedAt: new Date()
      });
      message.viewCount = (message.viewCount || 0) + 1;
      await message.save();
    }

    res.json({ success: true, viewCount: message.viewCount });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/seen', authenticate, async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.id).populate('chat');
    if (!message) {
      return res.status(404).json({ message: 'پیام یافت نشد' });
    }

    const chat = message.chat;
    if (!chat || (chat.type !== 'group' && chat.type !== 'channel')) {
      return res.status(400).json({ message: 'این قابلیت فقط برای گروه‌ها و کانال‌ها است' });
    }

    if (!message.readBy) {
      message.readBy = [];
    }

    const existingRead = message.readBy.find(
      read => read.user.toString() === req.user._id.toString()
    );

    if (!existingRead) {
      message.readBy.push({
        user: req.user._id,
        readAt: new Date()
      });
      await message.save();

      const io = req.app.get('io');
      if (io) {
        io.to(`chat:${message.chat._id || message.chat}`).emit('message:seen', {
          messageId: message._id,
          userId: req.user._id,
          readAt: new Date()
        });
      }
    }

    res.json({ success: true, message: 'پیام به عنوان مشاهده شده علامت‌گذاری شد' });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/seen', authenticate, async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.id)
      .populate('readBy.user', 'username firstName lastName avatar isOnline lastSeen')
      .populate('chat', 'participants subscribers type');
    
    if (!message) {
      return res.status(404).json({ message: 'پیام یافت نشد' });
    }

    const chat = message.chat;
    if (!chat || (chat.type !== 'group' && chat.type !== 'channel')) {
      return res.status(400).json({ message: 'این قابلیت فقط برای گروه‌ها و کانال‌ها است' });
    }

    const seenList = (message.readBy || []).map(item => ({
      user: item.user,
      readAt: item.readAt,
      seenAt: item.readAt
    }));

    res.json({ 
      success: true, 
      seenList,
      totalSeen: seenList.length,
      totalParticipants: chat.participants?.length || chat.subscribers?.length || 0
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/like', authenticate, async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ message: 'پیام یافت نشد' });
    }

    const chat = await Chat.findById(message.chat);
    if (chat?.type === 'channel' && chat?.channelSettings?.allowReactions === false) {
      return res.status(403).json({ message: 'واکنش‌ها در این کانال غیرفعال است' });
    }

    const existingLike = message.likes?.find(
      l => l.user.toString() === req.user._id.toString()
    );

    if (existingLike) {
      message.likes = message.likes.filter(
        l => l.user.toString() !== req.user._id.toString()
      );
      message.likeCount = Math.max(0, (message.likeCount || 0) - 1);
    } else {
      if (!message.likes) {
        message.likes = [];
      }
      message.likes.push({
        user: req.user._id,
        likedAt: new Date()
      });
      message.likeCount = (message.likeCount || 0) + 1;
    }

    await message.save();
    await message.populate('likes.user', 'username firstName lastName avatar');

    const io = req.app.get('io');
    if (io) {
      io.to(`chat:${message.chat}`).emit('message:updated', message);
    }

    res.json({ success: true, message });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/comment', authenticate, async (req, res, next) => {
  try {
    const { content } = req.body;
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ message: 'پیام یافت نشد' });
    }

    const chat = await Chat.findById(message.chat);
    if (chat?.type === 'channel') {
      if (chat?.channelSettings?.allowComments === false) {
        return res.status(403).json({ message: 'کامنت‌ها در این کانال غیرفعال است' });
      }
      if (chat?.channelSettings?.onlyAdminsCanComment && !chat.admins.includes(req.user._id)) {
        return res.status(403).json({ message: 'فقط ادمین‌ها می‌توانند کامنت بگذارند' });
      }
    }

    if (!message.comments) {
      message.comments = [];
    }

    message.comments.push({
      user: req.user._id,
      content,
      createdAt: new Date()
    });
    message.commentCount = (message.commentCount || 0) + 1;

    await message.save();
    await message.populate('comments.user', 'username firstName lastName avatar');

    const io = req.app.get('io');
    if (io) {
      io.to(`chat:${message.chat}`).emit('message:updated', message);
    }

    if (chat?.type === 'channel') {
      chat.channelStats.totalComments = (chat.channelStats?.totalComments || 0) + 1;
      await chat.save();
    }

    res.json({ success: true, message });
  } catch (error) {
    next(error);
  }
});

router.put('/:id/comment/:commentId', authenticate, async (req, res, next) => {
  try {
    const { content } = req.body;
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ message: 'پیام یافت نشد' });
    }

    const comment = message.comments?.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'کامنت یافت نشد' });
    }

    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'شما نمی‌توانید این کامنت را ویرایش کنید' });
    }

    comment.content = content;
    comment.isEdited = true;
    comment.editedAt = new Date();
    await message.save();

    const io = req.app.get('io');
    if (io) {
      io.to(`chat:${message.chat}`).emit('message:updated', message);
    }

    res.json({ success: true, message });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id/comment/:commentId', authenticate, async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ message: 'پیام یافت نشد' });
    }

    const comment = message.comments?.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: 'کامنت یافت نشد' });
    }

    const chat = await Chat.findById(message.chat);
    const isAdmin = chat?.admins?.includes(req.user._id);

    if (comment.user.toString() !== req.user._id.toString() && !isAdmin) {
      return res.status(403).json({ message: 'شما نمی‌توانید این کامنت را حذف کنید' });
    }

    message.comments = message.comments.filter(
      c => c._id.toString() !== req.params.commentId
    );
    message.commentCount = Math.max(0, (message.commentCount || 0) - 1);
    await message.save();

    const io = req.app.get('io');
    if (io) {
      io.to(`chat:${message.chat}`).emit('message:updated', message);
    }

    res.json({ success: true, message });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/poll', authenticate, async (req, res, next) => {
  try {
    const { question, options, isMultipleChoice, endsAt } = req.body;
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ message: 'پیام یافت نشد' });
    }

    const chat = await Chat.findById(message.chat);
    if (chat?.type !== 'channel') {
      return res.status(400).json({ message: 'نظرسنجی فقط برای کانال‌ها است' });
    }

    if (!chat.admins.includes(req.user._id) && chat.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'فقط ادمین‌ها می‌توانند نظرسنجی ایجاد کنند' });
    }

    message.poll = {
      question,
      options: options.map(opt => ({
        text: opt,
        votes: [],
        voteCount: 0
      })),
      isMultipleChoice: isMultipleChoice || false,
      endsAt: endsAt ? new Date(endsAt) : null,
      isActive: true
    };

    await message.save();

    const io = req.app.get('io');
    if (io) {
      io.to(`chat:${message.chat}`).emit('message:updated', message);
    }

    res.json({ success: true, message });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/poll/vote', authenticate, async (req, res, next) => {
  try {
    const { optionIndex } = req.body;
    const message = await Message.findById(req.params.id);
    if (!message || !message.poll) {
      return res.status(404).json({ message: 'نظرسنجی یافت نشد' });
    }

    if (!message.poll.isActive) {
      return res.status(400).json({ message: 'نظرسنجی به پایان رسیده است' });
    }

    if (message.poll.endsAt && new Date(message.poll.endsAt) < new Date()) {
      message.poll.isActive = false;
      await message.save();
      return res.status(400).json({ message: 'نظرسنجی به پایان رسیده است' });
    }

    const option = message.poll.options[optionIndex];
    if (!option) {
      return res.status(400).json({ message: 'گزینه نامعتبر است' });
    }

    const hasVoted = option.votes.some(v => v.toString() === req.user._id.toString());

    if (hasVoted && !message.poll.isMultipleChoice) {
      option.votes = option.votes.filter(v => v.toString() !== req.user._id.toString());
      option.voteCount = Math.max(0, option.voteCount - 1);
    } else if (!hasVoted) {
      if (!message.poll.isMultipleChoice) {
        message.poll.options.forEach(opt => {
          opt.votes = opt.votes.filter(v => v.toString() !== req.user._id.toString());
          opt.voteCount = opt.votes.length;
        });
      }
      option.votes.push(req.user._id);
      option.voteCount = option.votes.length;
    }

    await message.save();

    const io = req.app.get('io');
    if (io) {
      io.to(`chat:${message.chat}`).emit('message:updated', message);
    }

    res.json({ success: true, message });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/share', authenticate, async (req, res, next) => {
  try {
    const { chatId } = req.body;
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ message: 'پیام یافت نشد' });
    }

    const targetChat = await Chat.findOne({
      _id: chatId,
      participants: req.user._id
    });

    if (!targetChat) {
      return res.status(404).json({ message: 'چت مقصد یافت نشد' });
    }

    if (!message.shares) {
      message.shares = [];
    }

    const existingShare = message.shares.find(
      s => s.user.toString() === req.user._id.toString() && s.sharedTo.toString() === chatId
    );

    if (!existingShare) {
      message.shares.push({
        user: req.user._id,
        sharedAt: new Date(),
        sharedTo: chatId
      });
      message.shareCount = (message.shareCount || 0) + 1;
      await message.save();
    }

    res.json({ success: true, shareCount: message.shareCount });
  } catch (error) {
    next(error);
  }
});

export default router;

