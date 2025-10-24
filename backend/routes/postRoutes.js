const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const {
  validatePost,
  validateComment,
  validateLinkPreview,
} = require("../middleware/postValidation");
const postController = require("../controllers/postController");

// Post creation routes
router.post("/", authenticate, validatePost, postController.createPost);
router.post("/media/upload", authenticate, postController.uploadMedia);
router.post(
  "/media",
  authenticate,
  validatePost,
  postController.createMediaPost
);
router.post(
  "/link-preview",
  authenticate,
  validateLinkPreview,
  postController.generateLinkPreview
);

// Post retrieval routes
router.get("/", postController.getPosts);
router.get("/trending", postController.getTrendingPosts);
router.get("/search", postController.searchPosts);
router.get("/:postId", postController.getPostById);

// Post interaction routes
router.post("/:postId/like", authenticate, postController.toggleLike);
router.post(
  "/:postId/comment",
  authenticate,
  validateComment,
  postController.addComment
);

// Post management routes
router.delete("/:postId", authenticate, postController.deletePost);

module.exports = router;
