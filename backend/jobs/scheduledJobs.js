const cron = require("node-cron");
const recommendationService = require("../services/recommendationService");
const emailService = require("../services/emailService");
const User = require("../models/User");
const { Post } = require("../models/Posts");

class ScheduledJobs {
  /**
   * Initialize all scheduled jobs
   */
  static initJobs() {
    console.log("🕐 Initializing scheduled jobs...");

    // Update trending scores every hour
    this.scheduleTrendingUpdate();

    // Send daily digests at 9 AM
    this.scheduleDailyDigests();

    // Send weekly digests on Monday at 9 AM
    this.scheduleWeeklyDigests();

    console.log("✅ All scheduled jobs initialized");
  }

  /**
   * Update trending scores for posts
   * Runs every hour at minute 0
   */
  static scheduleTrendingUpdate() {
    cron.schedule("0 * * * *", async () => {
      console.log("🔥 Running trending score update...");
      try {
        await recommendationService.updateTrendingScores();
      } catch (error) {
        console.error("Error updating trending scores:", error);
      }
    });

    console.log("✓ Trending score update job scheduled (hourly)");
  }

  /**
   * Send daily digests to users
   * Runs every day at 9:00 AM
   */
  static scheduleDailyDigests() {
    cron.schedule("0 9 * * *", async () => {
      console.log("📰 Sending daily digests...");
      try {
        // Get users who opted for daily digests
        const users = await User.find({
          "notificationPreferences.emailNotifications": true,
          "notificationPreferences.digestFrequency": "daily",
        });

        console.log(`Found ${users.length} users for daily digest`);

        // Get trending posts from last 24 hours
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const trendingPosts = await Post.find({
          createdAt: { $gte: oneDayAgo },
          status: "published",
          moderationStatus: { $in: ["approved", "pending_review"] },
        })
          .populate(
            "author",
            "firstName lastName username profileImage isVerified"
          )
          .sort({ trendingScore: -1 })
          .limit(5)
          .lean();

        if (trendingPosts.length === 0) {
          console.log("No trending posts found for daily digest");
          return;
        }

        // Send digest to each user
        let sentCount = 0;
        for (const user of users) {
          try {
            await emailService.sendDailyDigest(user, trendingPosts);
            sentCount++;
          } catch (error) {
            console.error(
              `Failed to send daily digest to ${user.email}:`,
              error
            );
          }
        }

        console.log(`✅ Daily digests sent to ${sentCount} users`);
      } catch (error) {
        console.error("Error sending daily digests:", error);
      }
    });

    console.log("✓ Daily digest job scheduled (9:00 AM daily)");
  }

  /**
   * Send weekly digests to users
   * Runs every Monday at 9:00 AM
   */
  static scheduleWeeklyDigests() {
    cron.schedule("0 9 * * 1", async () => {
      console.log("📬 Sending weekly digests...");
      try {
        // Get users who opted for weekly digests
        const users = await User.find({
          "notificationPreferences.emailNotifications": true,
          "notificationPreferences.digestFrequency": "weekly",
        });

        console.log(`Found ${users.length} users for weekly digest`);

        // Get trending posts from last 7 days
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const trendingPosts = await Post.find({
          createdAt: { $gte: sevenDaysAgo },
          status: "published",
          moderationStatus: { $in: ["approved", "pending_review"] },
        })
          .populate(
            "author",
            "firstName lastName username profileImage isVerified"
          )
          .sort({ trendingScore: -1 })
          .limit(10)
          .lean();

        if (trendingPosts.length === 0) {
          console.log("No trending posts found for weekly digest");
          return;
        }

        // Send digest to each user
        let sentCount = 0;
        for (const user of users) {
          try {
            await emailService.sendWeeklyDigest(user, trendingPosts);
            sentCount++;
          } catch (error) {
            console.error(
              `Failed to send weekly digest to ${user.email}:`,
              error
            );
          }
        }

        console.log(`✅ Weekly digests sent to ${sentCount} users`);
      } catch (error) {
        console.error("Error sending weekly digests:", error);
      }
    });

    console.log("✓ Weekly digest job scheduled (Monday 9:00 AM)");
  }

  /**
   * Manual trigger for testing (use via API endpoint)
   */
  static async manualTrendingUpdate() {
    console.log("🔥 Manual trending update triggered");
    return await recommendationService.updateTrendingScores();
  }

  static async manualDailyDigest(userId) {
    console.log(`📰 Manual daily digest triggered for user ${userId}`);
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const trendingPosts = await Post.find({
      createdAt: { $gte: oneDayAgo },
      status: "published",
      moderationStatus: "approved",
    })
      .populate("author", "firstName lastName username profileImage isVerified")
      .sort({ trendingScore: -1 })
      .limit(5)
      .lean();

    await emailService.sendDailyDigest(user, trendingPosts);
    return { success: true, message: "Daily digest sent" };
  }

  static async manualWeeklyDigest(userId) {
    console.log(`📬 Manual weekly digest triggered for user ${userId}`);
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const trendingPosts = await Post.find({
      createdAt: { $gte: sevenDaysAgo },
      status: "published",
      moderationStatus: "approved",
    })
      .populate("author", "firstName lastName username profileImage isVerified")
      .sort({ trendingScore: -1 })
      .limit(10)
      .lean();

    await emailService.sendWeeklyDigest(user, trendingPosts);
    return { success: true, message: "Weekly digest sent" };
  }
}

module.exports = ScheduledJobs;
