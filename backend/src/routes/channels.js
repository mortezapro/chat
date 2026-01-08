import express from 'express';
import { authenticate } from '../middleware/auth.js';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import User from '../models/User.js';

const router = express.Router();

router.get('/:id/stats', authenticate, async (req, res, next) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.id,
      type: 'channel',
      $or: [
        { createdBy: req.user._id },
        { admins: req.user._id }
      ]
    });

    if (!chat) {
      return res.status(404).json({ message: 'کانال یافت نشد یا دسترسی ندارید' });
    }

    const totalMessages = await Message.countDocuments({ chat: chat._id, isDeleted: false });
    const totalViews = await Message.aggregate([
      { $match: { chat: chat._id } },
      { $group: { _id: null, total: { $sum: '$viewCount' } } }
    ]);

    const viewsByDate = await Message.aggregate([
      { $match: { chat: chat._id } },
      { $unwind: '$views' },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$views.viewedAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 30 }
    ]);

    const topPosts = await Message.find({ chat: chat._id, isDeleted: false })
      .sort({ viewCount: -1 })
      .limit(10)
      .populate('sender', 'username firstName lastName avatar')
      .select('content viewCount likeCount commentCount createdAt');

    res.json({
      success: true,
      stats: {
        totalMembers: chat.subscribers?.length || chat.participants?.length || 0,
        totalPosts: totalMessages,
        totalViews: totalViews[0]?.total || 0,
        totalReactions: chat.channelStats?.totalReactions || 0,
        totalComments: chat.channelStats?.totalComments || 0,
        viewsByDate: viewsByDate.map(v => ({ date: v._id, count: v.count })),
        topPosts
      }
    });
  } catch (error) {
    next(error);
  }
});

router.put('/:id/settings', authenticate, async (req, res, next) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.id,
      type: 'channel',
      $or: [
        { createdBy: req.user._id },
        { admins: req.user._id }
      ]
    });

    if (!chat) {
      return res.status(404).json({ message: 'کانال یافت نشد یا دسترسی ندارید' });
    }

    const {
      isPublic,
      allowComments,
      allowReactions,
      onlyAdminsCanPost,
      onlyAdminsCanComment,
      maxPostsPerDay,
      restrictedWords,
      postScheduleEnabled,
      autoDeleteAfter
    } = req.body;

    if (!chat.channelSettings) {
      chat.channelSettings = {};
    }

    if (isPublic !== undefined) chat.channelSettings.isPublic = isPublic;
    if (allowComments !== undefined) chat.channelSettings.allowComments = allowComments;
    if (allowReactions !== undefined) chat.channelSettings.allowReactions = allowReactions;
    if (onlyAdminsCanPost !== undefined) chat.channelSettings.onlyAdminsCanPost = onlyAdminsCanPost;
    if (onlyAdminsCanComment !== undefined) chat.channelSettings.onlyAdminsCanComment = onlyAdminsCanComment;
    if (maxPostsPerDay !== undefined) chat.channelSettings.maxPostsPerDay = maxPostsPerDay;
    if (restrictedWords !== undefined) chat.channelSettings.restrictedWords = restrictedWords;
    if (postScheduleEnabled !== undefined) chat.channelSettings.postScheduleEnabled = postScheduleEnabled;
    if (autoDeleteAfter !== undefined) chat.channelSettings.autoDeleteAfter = autoDeleteAfter;

    await chat.save();
    res.json({ success: true, channelSettings: chat.channelSettings });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/subscribe', authenticate, async (req, res, next) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.id,
      type: 'channel'
    });

    if (!chat) {
      return res.status(404).json({ message: 'کانال یافت نشد' });
    }

    if (!chat.channelSettings?.isPublic && !chat.participants.includes(req.user._id)) {
      return res.status(403).json({ message: 'این کانال خصوصی است' });
    }

    const existingSubscriber = chat.subscribers?.find(
      s => s.user.toString() === req.user._id.toString()
    );

    if (existingSubscriber) {
      return res.status(400).json({ message: 'شما قبلاً عضو این کانال هستید' });
    }

    if (!chat.subscribers) {
      chat.subscribers = [];
    }

    chat.subscribers.push({
      user: req.user._id,
      subscribedAt: new Date(),
      notificationEnabled: true,
      role: 'subscriber'
    });

    if (!chat.participants.includes(req.user._id)) {
      chat.participants.push(req.user._id);
    }

    await chat.save();
    await chat.populate('subscribers.user', 'username firstName lastName avatar');

    res.json({ success: true, chat });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/unsubscribe', authenticate, async (req, res, next) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.id,
      type: 'channel'
    });

    if (!chat) {
      return res.status(404).json({ message: 'کانال یافت نشد' });
    }

    chat.subscribers = chat.subscribers?.filter(
      s => s.user.toString() !== req.user._id.toString()
    ) || [];

    await chat.save();
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/moderators', authenticate, async (req, res, next) => {
  try {
    const { userId } = req.body;
    const chat = await Chat.findOne({
      _id: req.params.id,
      type: 'channel',
      $or: [
        { createdBy: req.user._id },
        { admins: req.user._id }
      ]
    });

    if (!chat) {
      return res.status(404).json({ message: 'کانال یافت نشد یا دسترسی ندارید' });
    }

    const subscriber = chat.subscribers?.find(
      s => s.user.toString() === userId
    );

    if (!subscriber) {
      return res.status(400).json({ message: 'کاربر عضو کانال نیست' });
    }

    subscriber.role = 'moderator';
    await chat.save();

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id/moderators/:userId', authenticate, async (req, res, next) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.id,
      type: 'channel',
      $or: [
        { createdBy: req.user._id },
        { admins: req.user._id }
      ]
    });

    if (!chat) {
      return res.status(404).json({ message: 'کانال یافت نشد یا دسترسی ندارید' });
    }

    const subscriber = chat.subscribers?.find(
      s => s.user.toString() === req.params.userId
    );

    if (subscriber) {
      subscriber.role = 'subscriber';
      await chat.save();
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/members', authenticate, async (req, res, next) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.id,
      type: 'channel',
      $or: [
        { createdBy: req.user._id },
        { admins: req.user._id },
        { subscribers: { $elemMatch: { user: req.user._id } } }
      ]
    })
      .populate('subscribers.user', 'username firstName lastName avatar isOnline')
      .populate('participants', 'username firstName lastName avatar')
      .populate('admins', 'username firstName lastName avatar');

    if (!chat) {
      return res.status(404).json({ message: 'کانال یافت نشد' });
    }

    res.json({
      success: true,
      members: chat.subscribers || [],
      participants: chat.participants || [],
      admins: chat.admins || []
    });
  } catch (error) {
    next(error);
  }
});

// Search public channels
router.get('/search', authenticate, async (req, res, next) => {
  try {
    const { q, category } = req.query;
    
    if (!q || q.length < 2) {
      return res.json({ success: true, channels: [] });
    }

    const query = {
      type: 'channel',
      'channelSettings.isPublic': true,
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ]
    };

    if (category) {
      query.category = category;
    }

    const channels = await Chat.find(query)
      .populate('createdBy', 'username firstName lastName avatar')
      .populate('subscribers', '_id')
      .sort({ 'subscribers.length': -1, createdAt: -1 })
      .limit(50);

    res.json({ success: true, channels });
  } catch (error) {
    next(error);
  }
});

// Get trending channels
router.get('/trending', authenticate, async (req, res, next) => {
  try {
    const channels = await Chat.find({
      type: 'channel',
      'channelSettings.isPublic': true
    })
      .populate('createdBy', 'username firstName lastName avatar')
      .populate('subscribers', '_id')
      .sort({ 'subscribers.length': -1, activityLevel: -1 })
      .limit(20);

    res.json({ success: true, channels });
  } catch (error) {
    next(error);
  }
});

// Get channels by category
router.get('/category/:category', authenticate, async (req, res, next) => {
  try {
    const { category } = req.params;
    const channels = await Chat.find({
      type: 'channel',
      'channelSettings.isPublic': true,
      category
    })
      .populate('createdBy', 'username firstName lastName avatar')
      .populate('subscribers', '_id')
      .sort({ 'subscribers.length': -1 })
      .limit(50);

    res.json({ success: true, channels });
  } catch (error) {
    next(error);
  }
});

export default router;

