const UserEngagement = require("../models/UserEngagement");
const { Post } = require("../models/Posts");

class EngagementController {
  // Track post view
  async trackPostView(req, res) {
    try {
      const { postId } = req.params;
      const { duration = 0 } = req.body;
      const userId = req.user._id;

      const post = await Post.findById(postId);
      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Post not found",
        });
      }

      // Retry logic for handling version conflicts
      const maxRetries = 3;
      let retryCount = 0;
      let success = false;

      while (retryCount < maxRetries && !success) {
        try {
          let engagement = await UserEngagement.findOne({ user: userId });

          if (!engagement) {
            engagement = new UserEngagement({ user: userId });
          }

          // Add to viewed posts
          const existingView = engagement.viewedPosts.find(
            (vp) => vp.post.toString() === postId
          );

          if (!existingView) {
            engagement.viewedPosts.push({
              post: postId,
              viewedAt: new Date(),
              duration,
            });
            engagement.stats.totalViews += 1;
          } else {
            existingView.duration += duration;
            existingView.viewedAt = new Date();
          }

          // Update category engagement
          if (post.category) {
            await UserEngagement.updateCategoryEngagement(
              userId,
              post.category
            );
          }

          // Update average view duration
          const totalDuration = engagement.viewedPosts.reduce(
            (sum, vp) => sum + vp.duration,
            0
          );
          engagement.stats.avgViewDuration =
            totalDuration / engagement.viewedPosts.length;

          await engagement.save();
          success = true;
        } catch (saveError) {
          if (
            saveError.name === "VersionError" &&
            retryCount < maxRetries - 1
          ) {
            retryCount++;
            // Add small delay before retry to reduce collision probability
            await new Promise((resolve) =>
              setTimeout(resolve, 50 * retryCount)
            );
            continue;
          }
          throw saveError;
        }
      }

      if (!success) {
        throw new Error("Failed to save engagement after retries");
      }

      res.status(200).json({
        success: true,
        message: "View tracked successfully",
      });
    } catch (error) {
      console.error("Error tracking view:", error);
      res.status(500).json({
        success: false,
        message: "Failed to track view",
      });
    }
  }

  // Track post like
  async trackPostLike(req, res) {
    try {
      const { postId } = req.params;
      const userId = req.user._id;

      const post = await Post.findById(postId);
      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Post not found",
        });
      }

      // Retry logic for handling version conflicts
      const maxRetries = 3;
      let retryCount = 0;
      let success = false;

      while (retryCount < maxRetries && !success) {
        try {
          let engagement = await UserEngagement.findOne({ user: userId });

          if (!engagement) {
            engagement = new UserEngagement({ user: userId });
          }

          // Add to liked posts
          const existingLike = engagement.likedPosts.find(
            (lp) => lp.post.toString() === postId
          );

          if (!existingLike) {
            engagement.likedPosts.push({
              post: postId,
              likedAt: new Date(),
              category: post.category,
            });
            engagement.stats.totalLikes += 1;

            // Update category engagement
            if (post.category) {
              await UserEngagement.updateCategoryEngagement(
                userId,
                post.category
              );
            }
          }

          await engagement.save();
          success = true;
        } catch (saveError) {
          if (
            saveError.name === "VersionError" &&
            retryCount < maxRetries - 1
          ) {
            retryCount++;
            await new Promise((resolve) =>
              setTimeout(resolve, 50 * retryCount)
            );
            continue;
          }
          throw saveError;
        }
      }

      if (!success) {
        throw new Error("Failed to save engagement after retries");
      }

      res.status(200).json({
        success: true,
        message: "Like tracked successfully",
      });
    } catch (error) {
      console.error("Error tracking like:", error);
      res.status(500).json({
        success: false,
        message: "Failed to track like",
      });
    }
  }

  // Track post comment
  async trackPostComment(req, res) {
    try {
      const { postId } = req.params;
      const userId = req.user._id;

      const post = await Post.findById(postId);
      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Post not found",
        });
      }

      // Retry logic for handling version conflicts
      const maxRetries = 3;
      let retryCount = 0;
      let success = false;

      while (retryCount < maxRetries && !success) {
        try {
          let engagement = await UserEngagement.findOne({ user: userId });

          if (!engagement) {
            engagement = new UserEngagement({ user: userId });
          }

          // Add to commented posts
          const existingComment = engagement.commentedPosts.find(
            (cp) => cp.post.toString() === postId
          );

          if (!existingComment) {
            engagement.commentedPosts.push({
              post: postId,
              commentedAt: new Date(),
              category: post.category,
            });
            engagement.stats.totalComments += 1;

            // Update category engagement (weighted more than likes)
            if (post.category) {
              await UserEngagement.updateCategoryEngagement(
                userId,
                post.category
              );
              await UserEngagement.updateCategoryEngagement(
                userId,
                post.category
              ); // Count twice for comments
            }
          }

          await engagement.save();
          success = true;
        } catch (saveError) {
          if (
            saveError.name === "VersionError" &&
            retryCount < maxRetries - 1
          ) {
            retryCount++;
            await new Promise((resolve) =>
              setTimeout(resolve, 50 * retryCount)
            );
            continue;
          }
          throw saveError;
        }
      }

      if (!success) {
        throw new Error("Failed to save engagement after retries");
      }

      res.status(200).json({
        success: true,
        message: "Comment tracked successfully",
      });
    } catch (error) {
      console.error("Error tracking comment:", error);
      res.status(500).json({
        success: false,
        message: "Failed to track comment",
      });
    }
  }

  // Track search query
  async trackSearch(req, res) {
    try {
      const { query } = req.body;
      const userId = req.user._id;

      if (!query || !query.trim()) {
        return res.status(400).json({
          success: false,
          message: "Search query is required",
        });
      }

      let engagement = await UserEngagement.findOne({ user: userId });

      if (!engagement) {
        engagement = new UserEngagement({ user: userId });
      }

      // Add to search history (keep last 50)
      engagement.searchHistory.unshift({
        query: query.trim(),
        searchedAt: new Date(),
      });

      if (engagement.searchHistory.length > 50) {
        engagement.searchHistory = engagement.searchHistory.slice(0, 50);
      }

      await engagement.save();

      res.status(200).json({
        success: true,
        message: "Search tracked successfully",
      });
    } catch (error) {
      console.error("Error tracking search:", error);
      res.status(500).json({
        success: false,
        message: "Failed to track search",
      });
    }
  }

  // Get user engagement stats
  async getEngagementStats(req, res) {
    try {
      const userId = req.user._id;

      const engagement = await UserEngagement.findOne({ user: userId });

      if (!engagement) {
        return res.status(200).json({
          success: true,
          data: {
            stats: {
              totalViews: 0,
              totalLikes: 0,
              totalComments: 0,
              avgViewDuration: 0,
            },
            categoryEngagement: [],
            topCategories: [],
          },
        });
      }

      // Get top categories by engagement
      const topCategories = engagement.categoryEngagement
        .sort((a, b) => b.interactions - a.interactions)
        .slice(0, 5)
        .map((ce) => ({
          category: ce.category,
          interactions: ce.interactions,
          lastInteraction: ce.lastInteraction,
        }));

      res.status(200).json({
        success: true,
        data: {
          stats: engagement.stats,
          categoryEngagement: engagement.categoryEngagement,
          topCategories,
          recentSearches: engagement.searchHistory.slice(0, 10),
        },
      });
    } catch (error) {
      console.error("Error getting engagement stats:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get engagement stats",
      });
    }
  }
}

module.exports = new EngagementController();
