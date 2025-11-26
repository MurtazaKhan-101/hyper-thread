const express = require("express");
const router = express.Router();
const engagementController = require("../controllers/engagementController");
const { authenticate } = require("../middleware/auth");

// All engagement routes require authentication
router.use(authenticate);

// Track post view
router.post("/view/:postId", engagementController.trackPostView);

// Track post like
router.post("/like/:postId", engagementController.trackPostLike);

// Track post comment
router.post("/comment/:postId", engagementController.trackPostComment);

// Track search query
router.post("/search", engagementController.trackSearch);

// Get user engagement statistics
router.get("/stats", engagementController.getEngagementStats);

module.exports = router;
