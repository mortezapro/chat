import express from 'express';
import { authenticate } from '../middleware/auth.js';
import Story from '../models/Story.js';
import { uploadSingle } from '../middleware/upload.js';
import path from 'path';

const router = express.Router();

// Get all active stories
router.get('/', authenticate, async (req, res, next) => {
  try {
    const stories = await Story.find({
      expiresAt: { $gt: new Date() }
    })
      .populate('user', 'username firstName lastName avatar')
      .sort({ createdAt: -1 });

    res.json({ success: true, stories });
  } catch (error) {
    next(error);
  }
});

// Get user's stories
router.get('/user/:userId', authenticate, async (req, res, next) => {
  try {
    const stories = await Story.find({
      user: req.params.userId,
      expiresAt: { $gt: new Date() }
    })
      .populate('user', 'username firstName lastName avatar')
      .sort({ createdAt: -1 });

    res.json({ success: true, stories });
  } catch (error) {
    next(error);
  }
});

// Create story
router.post('/', authenticate, uploadSingle, async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'فایل ارسال نشد' });
    }

    const { text } = req.body;
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours

    const fileUrl = `/uploads/${req.file.path.split('uploads')[1].replace(/\\/g, '/')}`;
    const mediaType = req.file.mimetype.startsWith('image/') ? 'image' : 'video';

    const story = new Story({
      user: req.user._id,
      media: {
        url: fileUrl,
        type: mediaType
      },
      text,
      expiresAt
    });

    await story.save();
    await story.populate('user', 'username firstName lastName avatar');

    res.status(201).json({ success: true, story });
  } catch (error) {
    next(error);
  }
});

// View story
router.post('/:id/view', authenticate, async (req, res, next) => {
  try {
    const story = await Story.findById(req.params.id);
    
    if (!story) {
      return res.status(404).json({ message: 'استوری یافت نشد' });
    }

    if (story.expiresAt < new Date()) {
      return res.status(400).json({ message: 'استوری منقضی شده است' });
    }

    const existingView = story.views.find(
      v => v.user.toString() === req.user._id.toString()
    );

    if (!existingView) {
      story.views.push({
        user: req.user._id,
        viewedAt: new Date()
      });
      await story.save();
    }

    res.json({ success: true, story });
  } catch (error) {
    next(error);
  }
});

// React to story
router.post('/:id/reaction', authenticate, async (req, res, next) => {
  try {
    const { emoji } = req.body;
    const story = await Story.findById(req.params.id);

    if (!story) {
      return res.status(404).json({ message: 'استوری یافت نشد' });
    }

    const existingReaction = story.reactions.find(
      r => r.user.toString() === req.user._id.toString()
    );

    if (existingReaction) {
      existingReaction.emoji = emoji;
    } else {
      story.reactions.push({
        user: req.user._id,
        emoji
      });
    }

    await story.save();
    res.json({ success: true, story });
  } catch (error) {
    next(error);
  }
});

// Delete story
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const story = await Story.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!story) {
      return res.status(404).json({ message: 'استوری یافت نشد' });
    }

    await story.deleteOne();
    res.json({ success: true, message: 'استوری حذف شد' });
  } catch (error) {
    next(error);
  }
});

export default router;




