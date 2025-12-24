const { Post } = require("../models/Posts");
const UserEngagement = require("../models/UserEngagement");
const User = require("../models/User");

class RecommendationService {
  /**
   * Calculate personalization score for a post based on user engagement
   */
  async calculatePostScore(post, user, userEngagement) {
    let score = 0;

    // 1. Interest match from signup (base score)
    if (user.interests && user.interests.includes(post.category)) {
      score += 50;
    }

    // 2. Category engagement score (learned behavior)
    if (post.category && userEngagement) {
      const categoryScore = await UserEngagement.getCategoryScore(
        user._id,
        post.category
      );
      score += categoryScore * 5;
    }

    // 3. Recency bonus (newer posts get higher priority)
    const daysSincePost =
      (Date.now() - new Date(post.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    score += Math.max(0, 30 - daysSincePost * 2);

    // 4. Popularity factor (but not too dominant)
    const likesScore = Math.min(post.likes * 0.5, 20); // Cap at 20
    const commentsScore = Math.min(post.comments.length * 1, 30); // Cap at 30
    score += likesScore + commentsScore;

    // 5. Author engagement (if user interacted with this author before)
    if (userEngagement) {
      const hasInteractedWithAuthor =
        userEngagement.likedPosts.some(
          (lp) =>
            lp.post && post.author.toString() === lp.post.author?.toString()
        ) ||
        userEngagement.commentedPosts.some(
          (cp) =>
            cp.post && post.author.toString() === cp.post.author?.toString()
        );

      if (hasInteractedWithAuthor) {
        score += 25;
      }
    }

    // 6. Diversity penalty (avoid showing only one category)
    // This would require tracking recently shown posts, implemented at controller level

    return score;
  }

  /**
   * Get personalized feed for a user
   */
  async getPersonalizedFeed(userId, page = 1, limit = 10, category = null) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      const userEngagement = await UserEngagement.findOne({ user: userId });

      // Get recent posts (last 30 days for better variety)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const filter = {
        status: "published",
        moderationStatus: { $in: ["approved", "pending_review"] },
        createdAt: { $gte: thirtyDaysAgo },
      };

      // Add category filter if specified
      if (category) {
        filter.category = category;
      }

      const posts = await Post.find(filter)
        .populate(
          "author",
          "firstName lastName username profileImage isVerified"
        )
        .lean();

      // Calculate scores for all posts
      const scoredPosts = await Promise.all(
        posts.map(async (post) => {
          const score = await this.calculatePostScore(
            post,
            user,
            userEngagement
          );
          return { ...post, personalizedScore: score };
        })
      );

      // Sort by personalized score
      scoredPosts.sort((a, b) => b.personalizedScore - a.personalizedScore);

      // Pagination
      const skip = (page - 1) * limit;
      const paginatedPosts = scoredPosts.slice(skip, skip + limit);

      return {
        posts: paginatedPosts,
        pagination: {
          currentPage: page,
          totalPosts: scoredPosts.length,
          totalPages: Math.ceil(scoredPosts.length / limit),
          hasNext: skip + limit < scoredPosts.length,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      console.error("Error generating personalized feed:", error);
      throw error;
    }
  }

  /**
   * Calculate trending score for a post
   */
  calculateTrendingScore(post) {
    const now = Date.now();
    const postAge =
      (now - new Date(post.createdAt).getTime()) / (1000 * 60 * 60); // hours

    if (postAge <= 0) return 0;

    // Time decay - exponential decay with 48-hour half-life
    const timeDecay = Math.exp(-postAge / 48);

    // Engagement velocity (engagement per hour)
    const totalEngagement = post.likes + post.comments.length * 2; // Comments weighted 2x
    const engagementVelocity = totalEngagement / Math.max(postAge, 0.1);

    // Recent engagement boost (last 24 hours)
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const recentLikes = post.likedBy
      ? post.likedBy.filter((like) => {
          // Assuming likedBy stores timestamp, adjust if needed
          return true; // Simplified - in production, track timestamps
        }).length
      : 0;

    // Trending score formula
    const trendingScore =
      engagementVelocity * 100 +
      recentLikes * 5 +
      post.comments.length * 10 +
      timeDecay * 50;

    return Math.round(trendingScore * 100) / 100; // Round to 2 decimals
  }

  /**
   * Update trending scores for all recent posts
   */
  async updateTrendingScores() {
    try {
      console.log("🔥 Updating trending scores...");

      // Get posts from last 7 days
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const posts = await Post.find({
        createdAt: { $gte: sevenDaysAgo },
        status: "published",
        moderationStatus: { $in: ["approved", "pending_review"] },
      }).populate("likedBy");

      let updatedCount = 0;

      for (const post of posts) {
        const newScore = this.calculateTrendingScore(post);
        post.trendingScore = newScore;
        post.lastTrendingUpdate = new Date();
        await post.save();
        updatedCount++;
      }

      console.log(`✅ Updated trending scores for ${updatedCount} posts`);

      return { success: true, updatedCount };
    } catch (error) {
      console.error("Error updating trending scores:", error);
      throw error;
    }
  }

  /**
   * Get trending posts
   */
  async getTrendingPosts(page = 1, limit = 10, category = null) {
    try {
      const filter = {
        status: "published",
        moderationStatus: { $in: ["approved", "pending_review"] },
        createdAt: {
          $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
        trendingScore: { $gt: 50 },
      };

      if (category) {
        filter.category = category;
      }

      const skip = (page - 1) * limit;

      const posts = await Post.find(filter)
        .populate(
          "author",
          "firstName lastName username profileImage isVerified"
        )
        .sort({ trendingScore: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const totalPosts = await Post.countDocuments(filter);

      return {
        posts,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalPosts / limit),
          totalPosts,
          hasNext: skip + limit < totalPosts,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      console.error("Error getting trending posts:", error);
      throw error;
    }
  }

  /**
   * Get similar posts based on category and tags
   */
  async getSimilarPosts(postId, limit = 5) {
    try {
      const post = await Post.findById(postId);
      if (!post) {
        throw new Error("Post not found");
      }

      const similarPosts = await Post.find({
        _id: { $ne: postId },
        status: "published",
        moderationStatus: "approved",
        $or: [{ category: post.category }, { tags: { $in: post.tags || [] } }],
      })
        .populate(
          "author",
          "firstName lastName username profileImage isVerified"
        )
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      return similarPosts;
    } catch (error) {
      console.error("Error getting similar posts:", error);
      throw error;
    }
  }
}

module.exports = new RecommendationService();
