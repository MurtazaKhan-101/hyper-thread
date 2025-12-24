const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const recommendationService = require("../services/recommendationService");

// All feed routes require authentication
router.use(authenticate);

// Get personalized feed
router.get("/personalized", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const category = req.query.category;

    const result = await recommendationService.getPersonalizedFeed(
      req.user.id,
      page,
      limit,
      category
    );

    res.status(200).json(result);
  } catch (error) {
    console.error("Error getting personalized feed:", error);
    res.status(500).json({
      message: "Error fetching personalized feed",
      error: error.message,
    });
  }
});

// Get trending posts
router.get("/trending", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const category = req.query.category;

    const result = await recommendationService.getTrendingPosts(
      page,
      limit,
      category
    );
    res.status(200).json(result);
  } catch (error) {
    console.error("Error getting trending posts:", error);
    res.status(500).json({
      message: "Error fetching trending posts",
      error: error.message,
    });
  }
});

// Get similar posts
router.get("/similar/:postId", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;

    const posts = await recommendationService.getSimilarPosts(
      req.params.postId,
      limit
    );

    res.status(200).json({ posts });
  } catch (error) {
    console.error("Error getting similar posts:", error);
    res.status(500).json({
      message: "Error fetching similar posts",
      error: error.message,
    });
  }
});

module.exports = router;
