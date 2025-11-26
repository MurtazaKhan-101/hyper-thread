const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const User = require("../models/User");

// Get notification preferences
router.get("/notification-preferences", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "notificationPreferences"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      preferences: user.notificationPreferences,
    });
  } catch (error) {
    console.error("Error getting notification preferences:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving notification preferences",
    });
  }
});

// Update notification preferences
router.put("/notification-preferences", authenticate, async (req, res) => {
  try {
    const { emailNotifications, digestFrequency, categories } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update preferences
    if (emailNotifications !== undefined) {
      user.notificationPreferences.emailNotifications = emailNotifications;
    }

    if (digestFrequency) {
      const validFrequencies = ["daily", "weekly", "never"];
      if (!validFrequencies.includes(digestFrequency)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid digest frequency. Must be 'daily', 'weekly', or 'never'",
        });
      }
      user.notificationPreferences.digestFrequency = digestFrequency;
    }

    if (Array.isArray(categories)) {
      user.notificationPreferences.categories = categories;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Notification preferences updated successfully",
      preferences: user.notificationPreferences,
    });
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    res.status(500).json({
      success: false,
      message: "Error updating notification preferences",
    });
  }
});

module.exports = router;
