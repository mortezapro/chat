import mongoose from 'mongoose';

const storySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  media: {
    url: String,
    type: {
      type: String,
      enum: ['image', 'video'],
      required: true
    },
    thumbnail: String
  },
  text: {
    type: String,
    maxlength: 200
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 }
  },
  views: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    viewedAt: {
      type: Date,
      default: Date.now
    }
  }],
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    emoji: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

storySchema.index({ user: 1, createdAt: -1 });
storySchema.index({ expiresAt: 1 });

export default mongoose.model('Story', storySchema);








