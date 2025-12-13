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
        subject: `Welcome to ${this.appName}!`,
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
      process.env.CLIENT_URL || "http://localhost:3000"
    }" class="button">Explore Now</a>
    
    <p style="margin-top: 30px;">If you have any questions, feel free to reach out to our community support.</p>
    
    <p>Happy posting!</p>
  </div>
  <div class="footer">
    <p>You're receiving this email because you signed up for ${
      this.appName
    }.</p>
    <p><a href="${
      process.env.CLIENT_URL
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
      process.env.CLIENT_URL || "http://localhost:3000"
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
      process.env.CLIENT_URL
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
      process.env.CLIENT_URL || "http://localhost:3000"
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
      process.env.CLIENT_URL
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
          process.env.CLIENT_URL || "http://localhost:3000"
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
      <a href="${process.env.CLIENT_URL || "http://localhost:3000"}" 
         style="display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px;">
        Explore More
      </a>
    </div>
  </div>
  <div class="footer">
    <p><a href="${
      process.env.CLIENT_URL
    }/settings/notifications">Manage email preferences</a></p>
  </div>
</body>
</html>
    `;
  }

  /**
   * Send payment failed notification
   */
  async sendPaymentFailedEmail(user, paymentDetails) {
    try {
      if (!user.email || !user.notificationPreferences?.emailNotifications) {
        return;
      }

      const html = this.getPaymentFailedTemplate(user, paymentDetails);

      await this.transporter.sendMail({
        from: this.fromEmail,
        to: user.email,
        subject: "Payment Failed - Action Required",
        html,
      });

      console.log(`✅ Payment failed email sent to ${user.email}`);
    } catch (error) {
      console.error("Error sending payment failed email:", error);
    }
  }

  /**
   * Send subscription cancelled notification
   */
  async sendSubscriptionCancelledEmail(user) {
    try {
      if (!user.email || !user.notificationPreferences?.emailNotifications) {
        return;
      }

      const html = this.getSubscriptionCancelledTemplate(user);

      await this.transporter.sendMail({
        from: this.fromEmail,
        to: user.email,
        subject: `Your ${this.appName} Premium subscription has been cancelled`,
        html,
      });

      console.log(`✅ Subscription cancelled email sent to ${user.email}`);
    } catch (error) {
      console.error("Error sending subscription cancelled email:", error);
    }
  }

  /**
   * Send subscription cancellation scheduled notification (when user cancels but still has access)
   */
  async sendSubscriptionCancellationScheduledEmail(user, cancelDate) {
    try {
      if (!user.email || !user.notificationPreferences?.emailNotifications) {
        return;
      }

      const html = this.getSubscriptionCancellationScheduledTemplate(
        user,
        cancelDate
      );

      await this.transporter.sendMail({
        from: this.fromEmail,
        to: user.email,
        subject: `Your ${
          this.appName
        } Premium will end on ${cancelDate.toLocaleDateString("en-GB")}`,
        html,
      });

      console.log(`✅ Cancellation scheduled email sent to ${user.email}`);
    } catch (error) {
      console.error("Error sending cancellation scheduled email:", error);
    }
  }

  /**
   * Payment failed email template
   */
  getPaymentFailedTemplate(user, paymentDetails) {
    const { amount, currency, nextRetryDate, attemptCount } = paymentDetails;
    const retryDateStr = nextRetryDate
      ? nextRetryDate.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "soon";

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
    .container { background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); color: white; padding: 30px; text-align: center; }
    .content { padding: 30px; }
    .warning-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">⚠️ Payment Failed</h1>
      <p style="margin: 10px 0 0 0;">Action required to continue your premium access</p>
    </div>
    <div class="content">
      <p>Hi ${user.firstName},</p>
      
      <div class="warning-box">
        <strong>We were unable to process your payment for ${
          this.appName
        } Premium.</strong>
      </div>
      
      <p><strong>Payment Details:</strong></p>
      <ul>
        <li>Amount: ${currency} ${amount}</li>
        <li>Attempt: ${attemptCount}</li>
        <li>Next retry: ${retryDateStr}</li>
      </ul>
      
      <p>Don't worry! Your premium access is still active while we retry the payment. We'll automatically attempt to charge your card again ${
        nextRetryDate ? "on " + retryDateStr : "soon"
      }.</p>
      
      <p><strong>What you can do:</strong></p>
      <ul>
        <li>Update your payment method to avoid service interruption</li>
        <li>Ensure your card has sufficient funds</li>
        <li>Check with your bank if payments are being blocked</li>
      </ul>
      
      <div style="text-align: center;">
        <a href="${
          process.env.FRONTEND_URL || "http://localhost:3000"
        }/settings" class="button">
          Update Payment Method
        </a>
      </div>
      
      <p style="color: #666; font-size: 14px; margin-top: 30px;">If payment continues to fail, your premium subscription will be cancelled automatically.</p>
    </div>
    <div class="footer">
      <p>Need help? <a href="${
        process.env.FRONTEND_URL || "http://localhost:3000"
      }/help">Contact Support</a></p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Subscription cancellation scheduled email template
   */
  getSubscriptionCancellationScheduledTemplate(user, cancelDate) {
    const cancelDateStr = cancelDate.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
    .container { background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); color: white; padding: 30px; text-align: center; }
    .content { padding: 30px; }
    .info-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
    .feature-list { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">⏳ Subscription Cancellation Confirmed</h1>
      <p style="margin: 10px 0 0 0;">You'll have premium access until ${cancelDateStr}</p>
    </div>
    <div class="content">
      <p>Hi ${user.firstName},</p>
      
      <p>We've received your cancellation request for ${
        this.appName
      } Premium.</p>
      
      <div class="info-box">
        <strong>Your premium access will end on ${cancelDateStr}.</strong><br>
        Until then, you can continue enjoying all premium features.
      </div>
      
      <p><strong>What happens next:</strong></p>
      <ul>
        <li>You'll keep full premium access until ${cancelDateStr}</li>
        <li>You won't be charged again</li>
        <li>After ${cancelDateStr}, you'll switch to the free plan</li>
        <li>You can resubscribe anytime</li>
      </ul>
      
      <div class="feature-list">
        <p style="margin: 0 0 10px 0; font-weight: bold;">Premium features you'll lose after ${cancelDateStr}:</p>
        <ul style="margin: 0; padding-left: 20px;">
          <li>Create unlimited posts</li>
          <li>Comment on any discussion</li>
          <li>Join live chat rooms</li>
          <li>Priority support</li>
          <li>Ad-free experience</li>
        </ul>
      </div>
      
      <p><strong>Changed your mind?</strong> You can easily reactivate your subscription before ${cancelDateStr}.</p>
      
      <div style="text-align: center;">
        <a href="${
          process.env.FRONTEND_URL || "http://localhost:3000"
        }/settings" class="button">
          Reactivate Subscription
        </a>
      </div>
      
      <p style="color: #666; font-size: 14px; margin-top: 30px;">We'd love to hear your feedback! Let us know why you cancelled and how we can improve.</p>
    </div>
    <div class="footer">
      <p>Questions? <a href="${
        process.env.FRONTEND_URL || "http://localhost:3000"
      }/help">Contact Support</a></p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Subscription cancelled email template
   */
  getSubscriptionCancelledTemplate(user) {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
    .container { background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
    .content { padding: 30px; }
    .info-box { background: #e0e7ff; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
    .feature-list { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">Subscription Cancelled</h1>
      <p style="margin: 10px 0 0 0;">We're sorry to see you go</p>
    </div>
    <div class="content">
      <p>Hi ${user.firstName},</p>
      
      <p>Your ${
        this.appName
      } Premium subscription has been cancelled. We're sad to see you go, but we understand.</p>
      
      <div class="info-box">
        <strong>Your premium access has ended.</strong> You're now on the free plan.
      </div>
      
      <p><strong>What this means:</strong></p>
      <ul>
        <li>You can still browse and engage with the community</li>
        <li>Some premium features are no longer available</li>
        <li>You can resubscribe anytime to regain full access</li>
      </ul>
      
      <div class="feature-list">
        <p style="margin: 0 0 10px 0; font-weight: bold;">Premium features you'll miss:</p>
        <ul style="margin: 0; padding-left: 20px;">
          <li>Create unlimited posts</li>
          <li>Comment on any discussion</li>
          <li>Join live chat rooms</li>
          <li>Priority support</li>
          <li>Ad-free experience</li>
        </ul>
      </div>
      
      <p>Changed your mind? You can reactivate your premium subscription anytime!</p>
      
      <div style="text-align: center;">
        <a href="${
          process.env.FRONTEND_URL || "http://localhost:3000"
        }/pricing" class="button">
          Resubscribe to Premium
        </a>
      </div>
      
      <p style="color: #666; font-size: 14px; margin-top: 30px;">We'd love to hear your feedback! Let us know why you cancelled and how we can improve.</p>
    </div>
    <div class="footer">
      <p>Questions? <a href="${
        process.env.FRONTEND_URL || "http://localhost:3000"
      }/help">Contact Support</a></p>
    </div>
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
          process.env.CLIENT_URL || "http://localhost:3000"
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
      <a href="${process.env.CLIENT_URL || "http://localhost:3000"}" 
         style="display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px;">
        Explore More
      </a>
    </div>
  </div>
  <div class="footer">
    <p><a href="${
      process.env.CLIENT_URL
    }/settings/notifications">Manage email preferences</a></p>
  </div>
</body>
</html>
    `;
  }
}

module.exports = new EmailService();
