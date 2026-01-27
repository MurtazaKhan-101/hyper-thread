const User = require("../models/User");
const bcrypt = require("bcrypt");
const { Post } = require("../models/Posts");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const crypto = require("crypto");

// Configure R2 client
const r2Client = new S3Client({
  endpoint: process.env.R2_ENDPOINT,
  region: "auto",
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

// Get user profile
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        bio: user.bio,
        profileImage: user.profileImage,
        isPremium: user.isPremium,
        premiumExpiresAt: user.premiumExpiresAt,
        role: user.role,
        stats: user.stats,
        followers: user.followers,
        following: user.following,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching user profile",
    });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, username, bio } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Validate and update first name
    if (firstName !== undefined) {
      if (!firstName.trim()) {
        return res.status(400).json({
          success: false,
          message: "First name cannot be empty",
        });
      }
      user.firstName = firstName.trim();
    }

    // Validate and update last name
    if (lastName !== undefined) {
      if (!lastName.trim()) {
        return res.status(400).json({
          success: false,
          message: "Last name cannot be empty",
        });
      }
      user.lastName = lastName.trim();
    }

    // Validate and update username
    if (username !== undefined && username !== user.username) {
      const trimmedUsername = username.trim().toLowerCase();

      // Validate username format
      if (trimmedUsername.length < 3 || trimmedUsername.length > 20) {
        return res.status(400).json({
          success: false,
          message: "Username must be between 3 and 20 characters",
        });
      }

      if (!/^[a-zA-Z0-9_-]+$/.test(trimmedUsername)) {
        return res.status(400).json({
          success: false,
          message:
            "Username can only contain letters, numbers, underscores, and hyphens",
        });
      }

      // Check if username is already taken
      const existingUser = await User.findOne({
        username: trimmedUsername,
        _id: { $ne: userId },
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Username is already taken",
        });
      }

      user.username = trimmedUsername;
    }

    // Update bio
    if (bio !== undefined) {
      if (bio.length > 500) {
        return res.status(400).json({
          success: false,
          message: "Bio must be 500 characters or less",
        });
      }
      user.bio = bio.trim();
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        email: user.email,
        bio: user.bio,
        profileImage: user.profileImage,
        isPremium: user.isPremium,
        premiumExpiresAt: user.premiumExpiresAt,
        role: user.role,
        stats: user.stats,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({
      success: false,
      message: "Error updating profile",
    });
  }
};

// Generate presigned URL for profile image upload
exports.generateProfileImageUploadUrl = async (req, res) => {
  try {
    const { fileType } = req.body;
    const userId = req.user.id;

    if (!fileType) {
      return res.status(400).json({
        success: false,
        message: "File type is required",
      });
    }

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!allowedTypes.includes(fileType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed",
      });
    }

    // Generate unique filename
    const fileExtension = fileType.split("/")[1];
    const fileName = `profile-images/${userId}/${crypto.randomUUID()}.${fileExtension}`;

    // Generate presigned URL for upload
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: fileName,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(r2Client, command, {
      expiresIn: 300, // 5 minutes
    });

    const publicUrl = `${process.env.R2_PUBLIC_URL}/${fileName}`;

    res.status(200).json({
      success: true,
      uploadUrl,
      publicUrl,
      fileName,
    });
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    res.status(500).json({
      success: false,
      message: "Error generating upload URL",
    });
  }
};

// Update profile image URL after upload
exports.updateProfileImage = async (req, res) => {
  try {
    const { profileImage } = req.body;
    const userId = req.user.id;

    if (!profileImage) {
      return res.status(400).json({
        success: false,
        message: "Profile image URL is required",
      });
    }

    // Validate URL format
    try {
      new URL(profileImage);
    } catch (e) {
      return res.status(400).json({
        success: false,
        message: "Invalid profile image URL",
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { profileImage },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Profile image updated successfully",
      profileImage: user.profileImage,
    });
  } catch (error) {
    console.error("Error updating profile image:", error);
    res.status(500).json({
      success: false,
      message: "Error updating profile image",
    });
  }
};

// Update password
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters long",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if user has a password (might be OAuth-only user)
    if (!user.password) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot update password for accounts created with social login",
      });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Hash new password
    const saltRounds = parseInt(process.env.SALT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    user.password = hashedPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).json({
      success: false,
      message: "Error updating password",
    });
  }
};

// Delete account
exports.deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // If user has a password, verify it
    if (user.password) {
      if (!password) {
        return res.status(400).json({
          success: false,
          message: "Password is required to delete account",
        });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res.status(400).json({
          success: false,
          message: "Incorrect password",
        });
      }
    }

    // Delete user's posts
    await Post.deleteMany({ author: userId });

    // Delete user
    await User.findByIdAndDelete(userId);

    res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting account:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting account",
    });
  }
};

// Check username availability
exports.checkUsername = async (req, res) => {
  try {
    const { username } = req.params;
    const userId = req.user.id;

    if (!username) {
      return res.status(400).json({
        success: false,
        message: "Username is required",
      });
    }

    const trimmedUsername = username.trim().toLowerCase();

    // Validate username format
    if (trimmedUsername.length < 3 || trimmedUsername.length > 20) {
      return res.status(400).json({
        success: false,
        available: false,
        message: "Username must be between 3 and 20 characters",
      });
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(trimmedUsername)) {
      return res.status(400).json({
        success: false,
        available: false,
        message:
          "Username can only contain letters, numbers, underscores, and hyphens",
      });
    }

    // Check if username exists (excluding current user)
    const existingUser = await User.findOne({
      username: trimmedUsername,
      _id: { $ne: userId },
    });

    res.status(200).json({
      success: true,
      available: !existingUser,
      username: trimmedUsername,
    });
  } catch (error) {
    console.error("Error checking username:", error);
    res.status(500).json({
      success: false,
      message: "Error checking username availability",
    });
  }
};
