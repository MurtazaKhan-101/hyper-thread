const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const { validateComment } = require("../middleware/postValidation");
const commentController = require("../controllers/commentController");

router.post(
  "/:postId/comment",
  authenticate,
  validateComment,
  commentController.addComment
);
router.post(
  "/:postId/comment/:commentId/reply",
  authenticate,
  validateComment,
  commentController.addReply
);
router.post(
  "/:postId/comment/:commentId/like",
  authenticate,
  commentController.toggleCommentLike
);
router.post(
  "/:postId/comment/:commentId/reply/:replyId/like",
  authenticate,
  commentController.toggleReplyLike
);

router.put(
  "/:postId/comment/:commentId",
  authenticate,
  validateComment,
  commentController.editComment
);
router.delete(
  "/:postId/comment/:commentId",
  authenticate,
  commentController.deleteComment
);

module.exports = router;
