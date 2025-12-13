const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    username: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
      match: /^[a-zA-Z0-9_-]+$/, // Only alphanumeric, underscore, hyphen
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: false },
    profileImage: {
      type: String,
      default: "https://pub-ab2287d8b98448b28b402cbb2d7098d8.r2.dev/user.svg",
    },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    bio: { type: String, default: "" },
    interests: { type: [String], default: [] },
    followers: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },
    following: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "User",
      default: [],
    },
    isPremium: { type: Boolean, default: false },
    premiumExpiresAt: {
      type: Date,
      default: null,
    },
    stripeCustomerId: { type: String, default: null },
    stripeSubscriptionId: { type: String, default: null },
    subscriptionStatus: {
      type: String,
      enum: [
        "active",
        "past_due",
        "canceled",
        "incomplete",
        "incomplete_expired",
        "trialing",
        "unpaid",
        "paused",
      ],
      default: null,
    },
    stats: {
      postsCount: { type: Number, default: 0 },
      commentsCount: { type: Number, default: 0 },
      likesReceived: { type: Number, default: 0 },
      likesGiven: { type: Number, default: 0 },
    },

    // Notification preferences
    notificationPreferences: {
      emailNotifications: { type: Boolean, default: true },
      digestFrequency: {
        type: String,
        enum: ["daily", "weekly", "never"],
        default: "weekly",
      },
      lastEmailSent: { type: Date, default: null },
      categories: { type: [String], default: [] }, // Empty means all interests
    },

    isVerified: { type: Boolean, default: false },
    onboardingCompleted: { type: Boolean, default: false },
    onboardingStep: { type: Number, default: 0 }, // 0: not started, 1: username, 2: interests, 3: completed
    googleId: { type: String, default: null },
    googleRefreshToken: { type: String, default: null },
    refreshToken: { type: String, default: null },
    refreshTokenExpiry: { type: Date, default: null },
    otp: { type: String, default: null },
    otpExpiry: { type: Date, default: null },
    resetPasswordOTP: { type: String, default: null },
    resetPasswordOTPExpires: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now },
  },
  {
    collection: "users",
    timestamps: true,
  }
);

// userSchema.index({ username: 1 });
// userSchema.index({ email: 1 });
// userSchema.index({ googleId: 1 });
// userSchema.index({ createdAt: -1 });

userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.virtual("followerCount").get(function () {
  return this.followers.length;
});

userSchema.virtual("followingCount").get(function () {
  return this.following.length;
});

userSchema.methods.isFollowing = function (userId) {
  return this.following.includes(userId);
};

userSchema.pre("save", function (next) {
  // Handle subscription status logic
  if (this.subscriptionStatus) {
    // Active states - user should have premium
    if (["active", "trialing"].includes(this.subscriptionStatus)) {
      this.isPremium = true;
    }
    // Grace period states - keep premium active during payment retry period
    else if (this.subscriptionStatus === "past_due") {
      // Keep premium active while Stripe retries payment
      this.isPremium = true;
    }
    // Inactive states - remove premium
    else if (
      ["canceled", "incomplete_expired", "unpaid", "paused"].includes(
        this.subscriptionStatus
      )
    ) {
      this.isPremium = false;
    }
  }

  // Fallback: Check expiry date if subscription status not set
  if (
    this.isPremium &&
    this.premiumExpiresAt &&
    this.premiumExpiresAt < new Date() &&
    !this.subscriptionStatus
  ) {
    this.isPremium = false;
  }

  next();
});

userSchema.methods.toSafeObject = function () {
  const user = this.toObject();
  delete user.password;
  delete user.otp;
  delete user.otpExpiry;
  delete user.resetPasswordOTP;
  delete user.resetPasswordOTPExpires;
  delete user.googleRefreshToken;
  delete user.refreshToken;
  delete user.refreshTokenExpiry;
  delete user.twoFactorSecret;
  delete user.activeSessions;
  return user;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
