const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const {
  validatePost,
  validateLinkPreview,
} = require("../middleware/postValidation");
const {
  moderatePost,
  rateLimitByUser,
} = require("../middleware/contentModeration");
const postController = require("../controllers/postController");

// Post creation routes (with moderation and rate limiting)
router.post(
  "/",
  authenticate,
  rateLimitByUser(10, 60 * 60 * 1000), // 10 posts per hour
  validatePost,
  moderatePost,
  postController.createPost
);
router.post("/media/upload", authenticate, postController.uploadMedia);
router.post(
  "/media",
  authenticate,
  rateLimitByUser(10, 60 * 60 * 1000), // 10 posts per hour
  validatePost,
  moderatePost,
  postController.createMediaPost
);
router.post(
  "/link-preview",
  authenticate,
  validateLinkPreview,
  moderatePost,
  postController.generateLinkPreview
);

// Post retrieval routes
router.get("/", postController.getPosts);
router.get("/trending", postController.getTrendingPosts);
router.get("/search", postController.searchPosts);
router.get("/:postId", postController.getPostById);

// Post interaction routes
router.post("/:postId/like", authenticate, postController.toggleLike);

// Post management routes (with moderation on edit)
router.put(
  "/:postId",
  authenticate,
  validatePost,
  moderatePost,
  postController.updatePost
);
router.delete("/:postId", authenticate, postController.deletePost);

module.exports = router;
