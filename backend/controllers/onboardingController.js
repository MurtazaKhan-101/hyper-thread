const User = require("../models/User");

class OnboardingController {
  // Generate username suggestions
  async generateUsernameSuggestions(req, res) {
    try {
      const { firstName, lastName } = req.body;

      if (!firstName || !lastName) {
        return res.status(400).json({
          success: false,
          message: "First name and last name are required",
        });
      }

      // Clean and normalize names (remove special characters, keep only alphanumeric)
      const cleanFirstName = firstName.toLowerCase().replace(/[^a-z0-9]/g, "");
      const cleanLastName = lastName.toLowerCase().replace(/[^a-z0-9]/g, "");

      if (!cleanFirstName || !cleanLastName) {
        return res.status(400).json({
          success: false,
          message: "Invalid name format",
        });
      }

      // Generate username suggestions (only letters, numbers, underscores, hyphens)
      const baseUsername = `${cleanFirstName}${cleanLastName}`;
      const suggestions = [];

      // Format: firstname_lastname
      suggestions.push(`${cleanFirstName}_${cleanLastName}`);

      // Format: firstnamelastname
      suggestions.push(baseUsername);

      // Format: firstname-lastname
      suggestions.push(`${cleanFirstName}-${cleanLastName}`);

      // Format: firstnamelastname + random numbers (2-4 digits)
      for (let i = 0; i < 4; i++) {
        const randomNum = Math.floor(Math.random() * 9000) + 1000; // 4-digit number
        suggestions.push(`${baseUsername}${randomNum}`);
      }

      // Format: firstinitial + lastname
      if (cleanFirstName.length > 0) {
        suggestions.push(`${cleanFirstName[0]}${cleanLastName}`);
      }

      // Format: firstinitial_lastname
      if (cleanFirstName.length > 0) {
        suggestions.push(`${cleanFirstName[0]}_${cleanLastName}`);
      }

      // Format: firstname + lastinitial
      if (cleanLastName.length > 0) {
        suggestions.push(`${cleanFirstName}${cleanLastName[0]}`);
      }

      // Format: firstname_lastinitial
      if (cleanLastName.length > 0) {
        suggestions.push(`${cleanFirstName}_${cleanLastName[0]}`);
      }

      // Format: firstnamelastname + underscore + short random
      const shortRandom = Math.floor(Math.random() * 99) + 1;
      suggestions.push(`${baseUsername}_${shortRandom}`);

      // Format: firstname + random + lastname
      const midRandom = Math.floor(Math.random() * 99) + 1;
      suggestions.push(`${cleanFirstName}${midRandom}${cleanLastName}`);

      // Validate all suggestions match the regex
      const validSuggestions = suggestions.filter(
        (username) =>
          /^[a-zA-Z0-9_-]+$/.test(username) &&
          username.length >= 3 &&
          username.length <= 20
      );

      // Check availability for each valid suggestion
      const availableSuggestions = [];
      for (const username of validSuggestions) {
        const exists = await User.findOne({ username });
        if (!exists) {
          availableSuggestions.push(username);

          // Stop after finding 6 available ones
          if (availableSuggestions.length >= 6) {
            break;
          }
        }
      }

      // If we don't have enough suggestions, generate more with random numbers
      while (
        availableSuggestions.length < 5 &&
        availableSuggestions.length < validSuggestions.length * 2
      ) {
        const randomNum = Math.floor(Math.random() * 99999);
        const newSuggestion = `${baseUsername}${randomNum}`;

        if (newSuggestion.length <= 20) {
          const exists = await User.findOne({ username: newSuggestion });
          if (!exists && !availableSuggestions.includes(newSuggestion)) {
            availableSuggestions.push(newSuggestion);
          }
        }

        if (availableSuggestions.length >= 6) {
          break;
        }
      }

      res.status(200).json({
        success: true,
        suggestions: availableSuggestions.slice(0, 6), // Return top 6
      });
    } catch (error) {
      console.error("Error generating username suggestions:", error);
      res.status(500).json({
        success: false,
        message: "Server error generating suggestions",
      });
    }
  }

  // Check username availability
  async checkUsername(req, res) {
    try {
      const { username } = req.body;

      if (!username) {
        return res.status(400).json({
          success: false,
          message: "Username is required",
        });
      }

      // Validate username format
      if (username.length < 3 || username.length > 20) {
        return res.status(400).json({
          success: false,
          message: "Username must be between 3 and 20 characters",
        });
      }

      if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        return res.status(400).json({
          success: false,
          message:
            "Username can only contain letters, numbers, underscores, and hyphens",
        });
      }

      // Check if username exists
      const existingUser = await User.findOne({
        username: username.toLowerCase(),
      });

      if (existingUser) {
        return res.status(200).json({
          success: true,
          available: false,
          message: "Username is already taken",
        });
      }

      res.status(200).json({
        success: true,
        available: true,
        message: "Username is available",
      });
    } catch (error) {
      console.error("Error checking username:", error);
      res.status(500).json({
        success: false,
        message: "Server error checking username",
      });
    }
  }

  // Update username (Step 1)
  async updateUsername(req, res) {
    try {
      const { username } = req.body;
      const userId = req.user._id;

      if (!username) {
        return res.status(400).json({
          success: false,
          message: "Username is required",
        });
      }

      // Validate username
      if (username.length < 3 || username.length > 20) {
        return res.status(400).json({
          success: false,
          message: "Username must be between 3 and 20 characters",
        });
      }

      if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        return res.status(400).json({
          success: false,
          message:
            "Username can only contain letters, numbers, underscores, and hyphens",
        });
      }

      // Check if username is already taken
      const existingUser = await User.findOne({
        username: username.toLowerCase(),
        _id: { $ne: userId },
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "Username is already taken",
        });
      }

      // Update user
      const user = await User.findByIdAndUpdate(
        userId,
        {
          username: username.toLowerCase(),
          onboardingStep: 1,
        },
        { new: true }
      );

      res.status(200).json({
        success: true,
        message: "Username updated successfully",
        user: user.toSafeObject(),
      });
    } catch (error) {
      console.error("Error updating username:", error);
      res.status(500).json({
        success: false,
        message: "Server error updating username",
      });
    }
  }

  // Update interests (Step 2)
  async updateInterests(req, res) {
    try {
      const { interests } = req.body;
      const userId = req.user._id;

      if (!interests || !Array.isArray(interests)) {
        return res.status(400).json({
          success: false,
          message: "Interests must be an array",
        });
      }

      if (interests.length < 3) {
        return res.status(400).json({
          success: false,
          message: "Please select at least 3 interests",
        });
      }

      // Update user
      const user = await User.findByIdAndUpdate(
        userId,
        {
          interests: interests,
          onboardingStep: 2,
          onboardingCompleted: true,
        },
        { new: true }
      );

      res.status(200).json({
        success: true,
        message: "Interests updated successfully",
        user: user.toSafeObject(),
      });
    } catch (error) {
      console.error("Error updating interests:", error);
      res.status(500).json({
        success: false,
        message: "Server error updating interests",
      });
    }
  }

  // Get available interests
  async getAvailableInterests(req, res) {
    try {
      const interests = [
        "Technology",
        "Gaming",
        "Sports",
        "Music",
        "Movies & TV",
        "Art & Design",
        "Food & Cooking",
        "Travel",
        "Photography",
        "Science",
        "Programming",
        "Business",
        "Fashion",
        "Fitness",
        "Books",
        "Nature",
        "Politics",
        "Education",
        "News",
        "Anime & Manga",
        "Cars & Vehicles",
        "DIY & Crafts",
        "Health & Wellness",
        "History",
        "Pets & Animals",
      ];

      res.status(200).json({
        success: true,
        interests: interests.sort(),
      });
    } catch (error) {
      console.error("Error getting interests:", error);
      res.status(500).json({
        success: false,
        message: "Server error getting interests",
      });
    }
  }
}

const onboardingController = new OnboardingController();

module.exports = {
  generateUsernameSuggestions:
    onboardingController.generateUsernameSuggestions.bind(onboardingController),
  checkUsername: onboardingController.checkUsername.bind(onboardingController),
  updateUsername:
    onboardingController.updateUsername.bind(onboardingController),
  updateInterests:
    onboardingController.updateInterests.bind(onboardingController),
  getAvailableInterests:
    onboardingController.getAvailableInterests.bind(onboardingController),
};
