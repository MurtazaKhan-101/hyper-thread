const mongoose = require("mongoose");

// Recursive comment schema for infinite nesting
const commentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  comment: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  likes: {
    type: Number,
    default: 0,
  },
  likedBy: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  replies: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
    },
  ],
});

// Create Comment model
const Comment = mongoose.model("Comment", commentSchema);

const postSchema = new mongoose.Schema(
  {
    postType: {
      type: String,
      enum: ["text", "media", "link", "poll"],
      required: true,
      default: "text",
    },

    title: {
      type: String,
      required: true,
      maxlength: 300,
    },

    content: {
      type: String,
      required: false,
      default: "",
    },

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    flair: {
      type: String,
      default: null,
    },

    tags: {
      type: [String],
      default: [],
    },

    media: [
      {
        type: {
          type: String,
          enum: ["image", "video", "gif"],
          required: false,
        },
        url: {
          type: String,
          required: false,
        },
        thumbnail: {
          type: String,
          required: false,
        },
        width: Number,
        height: Number,
        duration: Number,
      },
    ],

    linkUrl: {
      type: String,
      required: false,
      validate: {
        validator: function (v) {
          if (this.postType === "link") {
            return /^https?:\/\/.+/.test(v);
          }
          return true;
        },
        message: "Invalid URL format",
      },
    },

    linkThumbnail: {
      type: String,
      default: null,
    },

    linkTitle: {
      type: String,
      default: null,
    },

    linkDescription: {
      type: String,
      default: null,
    },

    isMarkdown: {
      type: Boolean,
      default: false,
    },

    contentFormat: {
      type: String,
      enum: ["plain", "markdown", "html"],
      default: "plain",
    },

    // Post Status
    status: {
      type: String,
      enum: ["published", "edited", "deleted"],
      default: "published",
    },

    // Engagement
    likes: {
      type: Number,
      default: 0,
    },

    likedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Comments - Now using separate Comment model for infinite nesting
    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],

    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collection: "posts",
    timestamps: true,
  }
);

// Indexes for better performance
// postSchema.index({ author: 1, createdAt: -1 });
// postSchema.index({ postType: 1 });
// postSchema.index({ status: 1 });
// postSchema.index({ tags: 1 });

// Virtual for comment count
postSchema.virtual("commentCount").get(function () {
  return this.comments.length;
});

// Pre-save middleware
postSchema.pre("save", function (next) {
  if (
    this.isModified("status") &&
    this.status === "published" &&
    !this.publishedAt
  ) {
    this.publishedAt = new Date();
  }
  next();
});

const Post = mongoose.model("Post", postSchema);

module.exports = { Post, Comment };
