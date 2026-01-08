import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  chat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: true,
    index: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    enum: ['text', 'image', 'video', 'audio', 'file', 'location', 'contact', 'system'],
    default: 'text'
  },
  deletedFor: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  media: {
    url: String,
    thumbnail: String,
    size: Number,
    mimeType: String,
    duration: Number
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  forwardedFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  },
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    emoji: String
  }],
  isPinned: {
    type: Boolean,
    default: false
  },
  pinnedAt: {
    type: Date
  },
  pinnedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  linkPreview: {
    url: String,
    title: String,
    description: String,
    image: String,
    siteName: String
  },
  isSaved: {
    type: Boolean,
    default: false
  },
  savedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  selfDestruct: {
    enabled: {
      type: Boolean,
      default: false
    },
    delay: {
      type: Number,
      default: 30
    },
    destructAt: Date,
    readBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  reminders: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    remindAt: Date,
    message: String,
    isCompleted: {
      type: Boolean,
      default: false
    }
  }],
  tags: [{
    type: String,
    trim: true
  }],
  personalNotes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    note: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  isSilent: {
    type: Boolean,
    default: false
  },
  notificationDelay: {
    type: Number,
    default: null
  },
  scheduledAt: {
    type: Date,
    default: null
  },
  isScheduled: {
    type: Boolean,
    default: false
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
  viewCount: {
    type: Number,
    default: 0
  },
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    likedAt: {
      type: Date,
      default: Date.now
    }
  }],
  likeCount: {
    type: Number,
    default: 0
  },
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    content: String,
    createdAt: {
      type: Date,
      default: Date.now
    },
    isEdited: {
      type: Boolean,
      default: false
    },
    editedAt: Date,
    likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  }],
  commentCount: {
    type: Number,
    default: 0
  },
  shares: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    sharedAt: {
      type: Date,
      default: Date.now
    },
    sharedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat'
    }
  }],
  shareCount: {
    type: Number,
    default: 0
  },
  poll: {
    question: String,
    options: [{
      text: String,
      votes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }],
      voteCount: {
        type: Number,
        default: 0
      }
    }],
    isMultipleChoice: {
      type: Boolean,
      default: false
    },
    endsAt: Date,
    isActive: {
      type: Boolean,
      default: true
    }
  },
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isMentionAll: {
    type: Boolean,
    default: false
  },
  quotedMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    default: null
  }
}, {
  timestamps: true
});

messageSchema.index({ chat: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });

export default mongoose.model('Message', messageSchema);

