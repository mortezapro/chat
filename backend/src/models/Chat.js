import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['private', 'group', 'channel'],
    required: true
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  name: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    maxlength: 500
  },
  category: {
    type: String,
    enum: ['technology', 'entertainment', 'sports', 'news', 'education', 'business', 'other'],
    default: 'other'
  },
  avatar: {
    type: String,
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  admins: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  lastMessageAt: {
    type: Date,
    default: Date.now
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  settings: {
    muteUntil: Date,
    pinnedMessages: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    }],
    selfDestructEnabled: {
      type: Boolean,
      default: false
    },
    selfDestructDelay: {
      type: Number,
      default: 30
    },
    securitySettings: {
      onlyAdminsCanSend: Boolean,
      onlyAdminsCanPin: Boolean,
      onlyAdminsCanDelete: Boolean
    }
  },
  lastReadBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    lastReadMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    },
    lastReadAt: {
      type: Date,
      default: Date.now
    }
  }],
  inviteLink: {
    code: String,
    expiresAt: Date,
    maxUses: Number,
    currentUses: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: false
    }
  },
  mutedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    mutedUntil: Date
  }],
  userSettings: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    autoDownload: {
      type: Boolean,
      default: true
    },
    fontFamily: String,
    fontSize: Number
  }],
  summaries: [{
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    content: String,
    messageIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    }],
    isPinned: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  activityLevel: {
    type: Number,
    default: 0
  },
  lastActivityAt: {
    type: Date,
    default: Date.now
  },
  channelSettings: {
    isPublic: {
      type: Boolean,
      default: true
    },
    allowComments: {
      type: Boolean,
      default: true
    },
    allowReactions: {
      type: Boolean,
      default: true
    },
    onlyAdminsCanPost: {
      type: Boolean,
      default: false
    },
    onlyAdminsCanComment: {
      type: Boolean,
      default: false
    },
    maxPostsPerDay: {
      type: Number,
      default: null
    },
    restrictedWords: [{
      type: String,
      trim: true
    }],
    postScheduleEnabled: {
      type: Boolean,
      default: false
    },
    autoDeleteAfter: {
      type: Number,
      default: null
    }
  },
  channelStats: {
    totalMembers: {
      type: Number,
      default: 0
    },
    totalPosts: {
      type: Number,
      default: 0
    },
    totalViews: {
      type: Number,
      default: 0
    },
    totalReactions: {
      type: Number,
      default: 0
    },
    totalComments: {
      type: Number,
      default: 0
    },
    viewsByDate: [{
      date: Date,
      count: Number
    }],
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  subscribers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    subscribedAt: {
      type: Date,
      default: Date.now
    },
    notificationEnabled: {
      type: Boolean,
      default: true
    },
    role: {
      type: String,
      enum: ['subscriber', 'moderator'],
      default: 'subscriber'
    }
  }]
}, {
  timestamps: true
});

chatSchema.index({ participants: 1 });
chatSchema.index({ lastMessageAt: -1 });

export default mongoose.model('Chat', chatSchema);

