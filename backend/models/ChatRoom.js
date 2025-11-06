const mongoose = require("mongoose");

// Individual chat message schema
const messageSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  content: {
    type: String,
    required: function () {
      // Content is required for text messages, optional for image/system messages
      return this.messageType === "text";
    },
    trim: true,
    maxlength: 1000,
    default: "",
  },
  messageType: {
    type: String,
    enum: ["text", "image", "system"],
    default: "text",
  },
  imageUrl: {
    type: String,
    default: null,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  edited: {
    type: Boolean,
    default: false,
  },
  editedAt: {
    type: Date,
    default: null,
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },
  reactions: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      emoji: {
        type: String,
        required: true,
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
    },
  ],
});

// Chat room schema
const chatRoomSchema = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Posts",
      required: true,
      unique: true, // Each post can only have one chat room
    },
    participants: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
        lastSeen: {
          type: Date,
          default: Date.now,
        },
        isActive: {
          type: Boolean,
          default: true,
        },
      },
    ],
    messages: [messageSchema],
    settings: {
      isActive: {
        type: Boolean,
        default: true,
      },
      maxParticipants: {
        type: Number,
        default: 100,
      },
      allowImages: {
        type: Boolean,
        default: true,
      },
      moderationEnabled: {
        type: Boolean,
        default: false,
      },
    },
    stats: {
      totalMessages: {
        type: Number,
        default: 0,
      },
      activeParticipants: {
        type: Number,
        default: 0,
      },
      peakParticipants: {
        type: Number,
        default: 0,
      },
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collection: "chatrooms",
    timestamps: true,
  }
);

// Indexes for performance
chatRoomSchema.index({ post: 1 });
chatRoomSchema.index({ "participants.user": 1 });
chatRoomSchema.index({ "messages.timestamp": -1 });
chatRoomSchema.index({ lastActivity: -1 });

// Virtual for participant count
chatRoomSchema.virtual("participantCount").get(function () {
  return this.participants.filter((p) => p.isActive).length;
});

// Methods
chatRoomSchema.methods.addParticipant = function (userId) {
  const existingParticipant = this.participants.find(
    (p) => p.user.toString() === userId.toString()
  );

  if (existingParticipant) {
    existingParticipant.isActive = true;
    existingParticipant.lastSeen = new Date();
  } else {
    this.participants.push({
      user: userId,
      joinedAt: new Date(),
      lastSeen: new Date(),
      isActive: true,
    });
  }

  // Update stats
  const activeCount = this.participants.filter((p) => p.isActive).length;
  this.stats.activeParticipants = activeCount;
  if (activeCount > this.stats.peakParticipants) {
    this.stats.peakParticipants = activeCount;
  }
};

chatRoomSchema.methods.removeParticipant = function (userId) {
  const participant = this.participants.find(
    (p) => p.user.toString() === userId.toString()
  );

  if (participant) {
    participant.isActive = false;
    participant.lastSeen = new Date();
  }

  // Update active participants count
  this.stats.activeParticipants = this.participants.filter(
    (p) => p.isActive
  ).length;
};

chatRoomSchema.methods.addMessage = function (
  userId,
  content,
  messageType = "text",
  imageUrl = null
) {
  const message = {
    user: userId,
    content,
    messageType,
    imageUrl,
    timestamp: new Date(),
  };

  this.messages.push(message);
  this.stats.totalMessages += 1;
  this.lastActivity = new Date();

  return this.messages[this.messages.length - 1];
};

chatRoomSchema.methods.updateLastSeen = function (userId) {
  const participant = this.participants.find(
    (p) => p.user.toString() === userId.toString()
  );

  if (participant) {
    participant.lastSeen = new Date();
  }
};

chatRoomSchema.methods.isParticipant = function (userId) {
  return this.participants.some(
    (p) => p.user.toString() === userId.toString() && p.isActive
  );
};

// Pre-save middleware to limit message history (keep only last 1000 messages)
chatRoomSchema.pre("save", function (next) {
  if (this.messages.length > 1000) {
    this.messages = this.messages.slice(-1000);
  }
  next();
});

// Static methods
chatRoomSchema.statics.findByPost = function (postId) {
  return this.findOne({ post: postId });
};

chatRoomSchema.statics.getActiveRooms = function () {
  return this.find({
    "settings.isActive": true,
    "stats.activeParticipants": { $gt: 0 },
  }).sort({ lastActivity: -1 });
};

const ChatRoom = mongoose.model("ChatRoom", chatRoomSchema);

module.exports = ChatRoom;
