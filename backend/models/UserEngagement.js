const mongoose = require("mongoose");

const userEngagementSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Category engagement tracking
    categoryEngagement: [
      {
        category: {
          type: String,
          enum: [
            "culture",
            "entertainment",
            "technology",
            "science",
            "politics",
            "business",
            "health",
          ],
        },
        interactions: {
          type: Number,
          default: 0,
        },
        lastInteraction: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Post interactions
    viewedPosts: [
      {
        post: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Post",
        },
        viewedAt: {
          type: Date,
          default: Date.now,
        },
        duration: {
          type: Number, // seconds spent viewing
          default: 0,
        },
      },
    ],

    // Liked posts history
    likedPosts: [
      {
        post: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Post",
        },
        likedAt: {
          type: Date,
          default: Date.now,
        },
        category: String,
      },
    ],

    // Commented posts history
    commentedPosts: [
      {
        post: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Post",
        },
        commentedAt: {
          type: Date,
          default: Date.now,
        },
        category: String,
      },
    ],

    // Search history
    searchHistory: [
      {
        query: String,
        searchedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Engagement statistics
    stats: {
      totalViews: {
        type: Number,
        default: 0,
      },
      totalLikes: {
        type: Number,
        default: 0,
      },
      totalComments: {
        type: Number,
        default: 0,
      },
      avgViewDuration: {
        type: Number, // seconds
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance
userEngagementSchema.index({ user: 1, "categoryEngagement.category": 1 });
userEngagementSchema.index({ "viewedPosts.post": 1 });
userEngagementSchema.index({ "likedPosts.post": 1 });

// Static method to update category engagement
userEngagementSchema.statics.updateCategoryEngagement = async function (
  userId,
  category
) {
  const engagement = await this.findOne({ user: userId });

  if (!engagement) {
    return await this.create({
      user: userId,
      categoryEngagement: [
        {
          category,
          interactions: 1,
          lastInteraction: new Date(),
        },
      ],
    });
  }

  const categoryIndex = engagement.categoryEngagement.findIndex(
    (ce) => ce.category === category
  );

  if (categoryIndex === -1) {
    engagement.categoryEngagement.push({
      category,
      interactions: 1,
      lastInteraction: new Date(),
    });
  } else {
    engagement.categoryEngagement[categoryIndex].interactions += 1;
    engagement.categoryEngagement[categoryIndex].lastInteraction = new Date();
  }

  await engagement.save();
  return engagement;
};

// Static method to get category engagement score
userEngagementSchema.statics.getCategoryScore = async function (
  userId,
  category
) {
  const engagement = await this.findOne({ user: userId });

  if (!engagement) return 0;

  const categoryEngagement = engagement.categoryEngagement.find(
    (ce) => ce.category === category
  );

  if (!categoryEngagement) return 0;

  // Calculate score based on interactions and recency
  const daysSinceLastInteraction =
    (Date.now() - categoryEngagement.lastInteraction) / (1000 * 60 * 60 * 24);
  const recencyBonus = Math.max(0, 10 - daysSinceLastInteraction);

  return categoryEngagement.interactions + recencyBonus;
};

const UserEngagement = mongoose.model("UserEngagement", userEngagementSchema);

module.exports = UserEngagement;
