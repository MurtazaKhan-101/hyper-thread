// Middleware to check if user has active premium subscription
const checkPremium = (req, res, next) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Grant full access to admin users
    if (user.role === "admin") {
      return next();
    }

    // Check if user has premium access
    if (!user.isPremium) {
      return res.status(403).json({
        success: false,
        message: "Premium subscription required",
        requiresPremium: true,
        code: "PREMIUM_REQUIRED",
      });
    }

    // Check if premium has expired
    if (user.premiumExpiresAt && user.premiumExpiresAt < new Date()) {
      // Update user's premium status to false
      user.isPremium = false;
      user.save().catch((err) => console.error("Error updating user:", err));

      return res.status(403).json({
        success: false,
        message: "Premium subscription has expired",
        requiresPremium: true,
        code: "PREMIUM_EXPIRED",
      });
    }

    // User has active premium, continue
    next();
  } catch (error) {
    console.error("Premium check error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during premium verification",
    });
  }
};

module.exports = { checkPremium };
