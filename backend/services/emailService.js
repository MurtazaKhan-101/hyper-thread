const nodemailer = require("nodemailer");
const User = require("../models/User");
const { Post } = require("../models/Posts");
const dotenv = require("dotenv");
dotenv.config();

// Create nodemailer transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_FROM,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
};

class EmailService {
  constructor() {
    this.fromEmail = process.env.EMAIL_FROM || "noreply@yourdomain.com";
    this.appName = "News Natter";
    this.transporter = createTransporter();
  }

  /**
   * Send welcome email to new users
   */
  async sendWelcomeEmail(user) {
    try {
      if (!user.email || !user.notificationPreferences?.emailNotifications) {
        return;
      }

      const html = this.getWelcomeEmailTemplate(user);

      await this.transporter.sendMail({
        from: this.fromEmail,
        to: user.email,
        subject: `Welcome to ${this.appName}! 🎉`,
        html,
      });

      console.log(`✅ Welcome email sent to ${user.email}`);
    } catch (error) {
      console.error("Error sending welcome email:", error);
    }
  }

  /**
   * Send notification about new comment on user's post
   */
  async sendCommentNotification(postAuthor, commenter, post, comment) {
    try {
      if (
        !postAuthor.email ||
        !postAuthor.notificationPreferences?.emailNotifications
      ) {
        return;
      }

      // Don't notify if user commented on their own post
      if (postAuthor._id.toString() === commenter._id.toString()) {
        return;
      }

      const html = this.getCommentNotificationTemplate(
        postAuthor,
        commenter,
        post,
        comment
      );

      await this.transporter.sendMail({
        from: this.fromEmail,
        to: postAuthor.email,
        subject: `${commenter.firstName} commented on your post`,
        html,
      });

      console.log(`✅ Comment notification sent to ${postAuthor.email}`);
    } catch (error) {
      console.error("Error sending comment notification:", error);
    }
  }

  /**
   * Send notification about reply to user's comment
   */
  async sendReplyNotification(commentAuthor, replier, post, reply) {
    try {
      if (
        !commentAuthor.email ||
        !commentAuthor.notificationPreferences?.emailNotifications
      ) {
        return;
      }

      // Don't notify if user replied to their own comment
      if (commentAuthor._id.toString() === replier._id.toString()) {
        return;
      }

      const html = this.getReplyNotificationTemplate(
        commentAuthor,
        replier,
        post,
        reply
      );

      await this.transporter.sendMail({
        from: this.fromEmail,
        to: commentAuthor.email,
        subject: `${replier.firstName} replied to your comment`,
        html,
      });

      console.log(`✅ Reply notification sent to ${commentAuthor.email}`);
    } catch (error) {
      console.error("Error sending reply notification:", error);
    }
  }

  /**
   * Send weekly digest of trending posts
   */
  async sendWeeklyDigest(user, trendingPosts) {
    try {
      if (
        !user.email ||
        !user.notificationPreferences?.emailNotifications ||
        user.notificationPreferences?.digestFrequency !== "weekly"
      ) {
        return;
      }

      // Check if digest was sent recently
      const lastSent = user.notificationPreferences?.lastEmailSent;
      if (lastSent) {
        const daysSinceLastEmail =
          (Date.now() - new Date(lastSent).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceLastEmail < 6) {
          // Wait at least 6 days
          return;
        }
      }

      const html = this.getWeeklyDigestTemplate(user, trendingPosts);

      await this.transporter.sendMail({
        from: this.fromEmail,
        to: user.email,
        subject: `Your Weekly ${this.appName} Digest`,
        html,
      });

      // Update last email sent timestamp
      user.notificationPreferences.lastEmailSent = new Date();
      await user.save();

      console.log(`✅ Weekly digest sent to ${user.email}`);
    } catch (error) {
      console.error("Error sending weekly digest:", error);
    }
  }

  /**
   * Send daily digest of trending posts
   */
  async sendDailyDigest(user, trendingPosts) {
    try {
      if (
        !user.email ||
        !user.notificationPreferences?.emailNotifications ||
        user.notificationPreferences?.digestFrequency !== "daily"
      ) {
        return;
      }

      // Check if digest was sent recently
      const lastSent = user.notificationPreferences?.lastEmailSent;
      if (lastSent) {
        const hoursSinceLastEmail =
          (Date.now() - new Date(lastSent).getTime()) / (1000 * 60 * 60);
        if (hoursSinceLastEmail < 20) {
          // Wait at least 20 hours
          return;
        }
      }

      const html = this.getDailyDigestTemplate(user, trendingPosts);

      await this.transporter.sendMail({
        from: this.fromEmail,
        to: user.email,
        subject: `Your Daily ${this.appName} Digest`,
        html,
      });

      // Update last email sent timestamp
      user.notificationPreferences.lastEmailSent = new Date();
      await user.save();

      console.log(`✅ Daily digest sent to ${user.email}`);
    } catch (error) {
      console.error("Error sending daily digest:", error);
    }
  }

  /**
   * Welcome email HTML template
   */
  getWelcomeEmailTemplate(user) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
    .content { background: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Welcome to ${this.appName}!</h1>
  </div>
  <div class="content">
    <p>Hi ${user.firstName},</p>
    
    <p>We're thrilled to have you join our community! ${
      this.appName
    } is a place where you can share your thoughts, connect with others, and discover interesting content.</p>
    
    <h3>Here's what you can do:</h3>
    <ul>
      <li>Create engaging posts</li>
      <li>Join discussions in your favorite categories</li>
      <li>Discover trending content</li>
      <li>Connect with like-minded people</li>
    </ul>
    
    <p>Ready to get started?</p>
    
    <a href="${
      process.env.FRONTEND_URL || "http://localhost:3000"
    }" class="button">Explore Now</a>
    
    <p style="margin-top: 30px;">If you have any questions, feel free to reach out to our community support.</p>
    
    <p>Happy posting!</p>
  </div>
  <div class="footer">
    <p>You're receiving this email because you signed up for ${
      this.appName
    }.</p>
    <p><a href="${
      process.env.FRONTEND_URL
    }/settings/notifications">Manage email preferences</a></p>
  </div>
</body>
</html>
    `;
  }

  /**
   * Comment notification email template
   */
  getCommentNotificationTemplate(postAuthor, commenter, post, comment) {
    const postUrl = `${
      process.env.FRONTEND_URL || "http://localhost:3000"
    }/discussion/${post._id}`;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #667eea; color: white; padding: 20px; border-radius: 10px 10px 0 0; }
    .content { background: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .comment-box { background: #f7f7f7; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0; border-radius: 5px; }
    .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h2>New Comment on Your Post</h2>
  </div>
  <div class="content">
    <p>Hi ${postAuthor.firstName},</p>
    
    <p><strong>${commenter.firstName} ${
      commenter.lastName
    }</strong> commented on your post:</p>
    
    <div class="comment-box">
      <p><strong>Your post:</strong> ${post.title}</p>
    </div>
    
    <div class="comment-box">
      <p><strong>Comment:</strong></p>
      <p>${comment.comment.substring(0, 200)}${
      comment.comment.length > 200 ? "..." : ""
    }</p>
    </div>
    
    <a href="${postUrl}" class="button">View Comment</a>
  </div>
  <div class="footer">
    <p><a href="${
      process.env.FRONTEND_URL
    }/settings/notifications">Unsubscribe from notifications</a></p>
  </div>
</body>
</html>
    `;
  }

  /**
   * Reply notification email template
   */
  getReplyNotificationTemplate(commentAuthor, replier, post, reply) {
    const postUrl = `${
      process.env.FRONTEND_URL || "http://localhost:3000"
    }/discussion/${post._id}`;

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #667eea; color: white; padding: 20px; border-radius: 10px 10px 0 0; }
    .content { background: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .comment-box { background: #f7f7f7; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0; border-radius: 5px; }
    .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h2>Reply to Your Comment</h2>
  </div>
  <div class="content">
    <p>Hi ${commentAuthor.firstName},</p>
    
    <p><strong>${replier.firstName} ${
      replier.lastName
    }</strong> replied to your comment:</p>
    
    <div class="comment-box">
      <p><strong>Reply:</strong></p>
      <p>${reply.comment.substring(0, 200)}${
      reply.comment.length > 200 ? "..." : ""
    }</p>
    </div>
    
    <a href="${postUrl}" class="button">View Reply</a>
  </div>
  <div class="footer">
    <p><a href="${
      process.env.FRONTEND_URL
    }/settings/notifications">Unsubscribe from notifications</a></p>
  </div>
</body>
</html>
    `;
  }

  /**
   * Weekly digest email template
   */
  getWeeklyDigestTemplate(user, posts) {
    const postCards = posts
      .slice(0, 5)
      .map(
        (post) => `
      <div style="background: #f7f7f7; padding: 20px; border-radius: 8px; margin: 15px 0;">
        <h3 style="margin: 0 0 10px 0; color: #333;">${post.title}</h3>
        <p style="color: #666; margin: 0 0 10px 0;">${(
          post.content || ""
        ).substring(0, 150)}...</p>
        <div style="display: flex; gap: 15px; font-size: 14px; color: #888;">
          <span>${post.likes} likes</span>
          <span>${post.comments.length} comments</span>
          <span>${Math.round(post.trendingScore)}</span>
        </div>
        <a href="${
          process.env.FRONTEND_URL || "http://localhost:3000"
        }/discussion/${post._id}" 
           style="display: inline-block; margin-top: 10px; color: #667eea; text-decoration: none;">Read more →</a>
      </div>
    `
      )
      .join("");

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
    .content { background: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Your Weekly Digest</h1>
    <p>Top trending posts from ${this.appName}</p>
  </div>
  <div class="content">
    <p>Hi ${user.firstName},</p>
    
    <p>Here are the top trending posts from this week:</p>
    
    ${postCards}
    
    <div style="text-align: center; margin-top: 30px;">
      <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}" 
         style="display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px;">
        Explore More
      </a>
    </div>
  </div>
  <div class="footer">
    <p><a href="${
      process.env.FRONTEND_URL
    }/settings/notifications">Manage email preferences</a></p>
  </div>
</body>
</html>
    `;
  }

  /**
   * Daily digest email template
   */
  getDailyDigestTemplate(user, posts) {
    const postCards = posts
      .slice(0, 3)
      .map(
        (post) => `
      <div style="background: #f7f7f7; padding: 20px; border-radius: 8px; margin: 15px 0;">
        <h3 style="margin: 0 0 10px 0; color: #333;">${post.title}</h3>
        <p style="color: #666; margin: 0 0 10px 0;">${(
          post.content || ""
        ).substring(0, 100)}...</p>
        <div style="display: flex; gap: 15px; font-size: 14px; color: #888;">
          <span>${post.likes}</span>
          <span>${post.comments.length}</span>
        </div>
        <a href="${
          process.env.FRONTEND_URL || "http://localhost:3000"
        }/discussion/${post._id}" 
           style="display: inline-block; margin-top: 10px; color: #667eea; text-decoration: none;">Read more →</a>
      </div>
    `
      )
      .join("");

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #667eea; color: white; padding: 25px; border-radius: 10px 10px 0 0; text-align: center; }
    .content { background: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Your Daily Digest</h1>
    <p>Today's trending posts</p>
  </div>
  <div class="content">
    <p>Hi ${user.firstName},</p>
    
    <p>Here's what's trending today:</p>
    
    ${postCards}
    
    <div style="text-align: center; margin-top: 30px;">
      <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}" 
         style="display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px;">
        Explore More
      </a>
    </div>
  </div>
  <div class="footer">
    <p><a href="${
      process.env.FRONTEND_URL
    }/settings/notifications">Manage email preferences</a></p>
  </div>
</body>
</html>
    `;
  }
}

module.exports = new EmailService();
