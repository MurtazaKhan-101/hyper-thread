const TrendingKeyword = require("../models/TrendingKeyword");
const recommendationService = require("../services/recommendationService");

class TrendingKeywordController {
  // List all trending keywords (active + inactive), newest first
  async listKeywords(req, res) {
    try {
      const keywords = await TrendingKeyword.find()
        .populate("createdBy", "firstName lastName username")
        .sort({ createdAt: -1 });

      res.status(200).json({ success: true, keywords });
    } catch (error) {
      console.error("Error listing trending keywords:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching trending keywords",
        error: error.message,
      });
    }
  }

  // Create a new trending keyword
  async createKeyword(req, res) {
    try {
      const { word, boost } = req.body;

      if (!word || !word.trim()) {
        return res.status(400).json({
          success: false,
          message: "Word is required",
        });
      }

      const normalizedWord = word.trim().toLowerCase();

      const existing = await TrendingKeyword.findOne({ word: normalizedWord });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: "This word is already in the trending list",
        });
      }

      const keyword = await TrendingKeyword.create({
        word: normalizedWord,
        boost: typeof boost === "number" ? boost : undefined,
        createdBy: req.user._id,
      });

      recommendationService.invalidateKeywordCache();

      res.status(201).json({ success: true, keyword });
    } catch (error) {
      console.error("Error creating trending keyword:", error);
      res.status(500).json({
        success: false,
        message: "Error creating trending keyword",
        error: error.message,
      });
    }
  }

  // Update an existing trending keyword
  async updateKeyword(req, res) {
    try {
      const { id } = req.params;
      const { word, boost, isActive } = req.body;

      const keyword = await TrendingKeyword.findById(id);
      if (!keyword) {
        return res.status(404).json({
          success: false,
          message: "Trending keyword not found",
        });
      }

      if (typeof word === "string") {
        const normalizedWord = word.trim().toLowerCase();
        if (!normalizedWord) {
          return res.status(400).json({
            success: false,
            message: "Word cannot be empty",
          });
        }

        const existing = await TrendingKeyword.findOne({
          word: normalizedWord,
          _id: { $ne: id },
        });
        if (existing) {
          return res.status(409).json({
            success: false,
            message: "This word is already in the trending list",
          });
        }

        keyword.word = normalizedWord;
      }

      if (typeof boost === "number") {
        keyword.boost = boost;
      }

      if (typeof isActive === "boolean") {
        keyword.isActive = isActive;
      }

      await keyword.save();

      recommendationService.invalidateKeywordCache();

      res.status(200).json({ success: true, keyword });
    } catch (error) {
      console.error("Error updating trending keyword:", error);
      res.status(500).json({
        success: false,
        message: "Error updating trending keyword",
        error: error.message,
      });
    }
  }

  // Delete a trending keyword
  async deleteKeyword(req, res) {
    try {
      const { id } = req.params;

      const keyword = await TrendingKeyword.findByIdAndDelete(id);
      if (!keyword) {
        return res.status(404).json({
          success: false,
          message: "Trending keyword not found",
        });
      }

      recommendationService.invalidateKeywordCache();

      res.status(200).json({ success: true, message: "Trending keyword deleted" });
    } catch (error) {
      console.error("Error deleting trending keyword:", error);
      res.status(500).json({
        success: false,
        message: "Error deleting trending keyword",
        error: error.message,
      });
    }
  }
}

module.exports = new TrendingKeywordController();
