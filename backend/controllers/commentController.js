const { Post } = require("../models/Posts");
const { Comment } = require("../models/Comments");
const User = require("../models/User");

class CommentController {
  // Helper function to recursively populate comments and their replies
  async populateCommentsRecursively(comments, depth = 0, maxDepth = 5) {
    if (depth > maxDepth) return comments;

    const populatedComments = await Comment.populate(comments, [
      {
        path: "user",
        select: "firstName lastName username profileImage isVerified",
      },
      {
        path: "replies",
        populate: {
          path: "user",
          select: "firstName lastName username profileImage isVerified",
        },
      },
    ]);

    // Recursively populate nested replies
    for (let comment of populatedComments) {
      if (comment.replies && comment.replies.length > 0) {
        comment.replies = await this.populateCommentsRecursively(
          comment.replies,
          depth + 1,
          maxDepth
        );
      }
    }

    return populatedComments;
  }

  // Add comment to post
  async addComment(req, res) {
    try {
      const { postId } = req.params;
      const { comment } = req.body;
      const userId = req.user._id;

      if (!comment || !comment.trim()) {
        return res.status(400).json({
          success: false,
          message: "Comment is required",
        });
      }

      const post = await Post.findById(postId);

      if (!post || post.status !== "published") {
        return res.status(404).json({
          success: false,
          message: "Post not found",
        });
      }

      // Create new comment document
      const newComment = new Comment({
        user: userId,
        comment: comment.trim(),
        likes: 0,
        likedBy: [],
        replies: [],
      });

      await newComment.save();

      // Add comment reference to post
      post.comments.push(newComment._id);
      await post.save();

      // Update user comment count
      await User.findByIdAndUpdate(userId, {
        $inc: { "stats.commentsCount": 1 },
      });

      // Populate the new comment
      await newComment.populate(
        "user",
        "firstName lastName username profileImage isVerified"
      );

      res.status(201).json({
        success: true,
        message: "Comment added successfully",
        comment: newComment,
      });
    } catch (error) {
      console.error("Error adding comment:", error);
      res.status(500).json({
        success: false,
        message: "Server error adding comment",
      });
    }
  }

  // Add reply to a comment (supports infinite nesting)
  async addReply(req, res) {
    try {
      const { postId, commentId } = req.params;
      const { comment } = req.body;
      const userId = req.user._id;

      if (!comment || !comment.trim()) {
        return res.status(400).json({
          success: false,
          message: "Reply is required",
        });
      }

      // Check if post exists
      const post = await Post.findById(postId);
      if (!post || post.status !== "published") {
        return res.status(404).json({
          success: false,
          message: "Post not found",
        });
      }

      // Check if comment exists (could be a top-level comment or a nested reply)
      const parentComment = await Comment.findById(commentId);
      if (!parentComment) {
        return res.status(404).json({
          success: false,
          message: "Comment not found",
        });
      }

      // Create new reply comment
      const newReply = new Comment({
        user: userId,
        comment: comment.trim(),
        likes: 0,
        likedBy: [],
        replies: [],
      });

      await newReply.save();

      // Add reply to parent comment
      parentComment.replies.push(newReply._id);
      await parentComment.save();

      // Update user comment count
      await User.findByIdAndUpdate(userId, {
        $inc: { "stats.commentsCount": 1 },
      });

      // Populate the new reply
      await newReply.populate(
        "user",
        "firstName lastName username profileImage isVerified"
      );

      res.status(201).json({
        success: true,
        message: "Reply added successfully",
        reply: newReply,
      });
    } catch (error) {
      console.error("Error adding reply:", error);
      res.status(500).json({
        success: false,
        message: "Server error adding reply",
      });
    }
  }

  // Like/unlike a comment
  async toggleCommentLike(req, res) {
    try {
      const { postId, commentId } = req.params;
      const userId = req.user._id;

      // Check if post exists
      const post = await Post.findById(postId);
      if (!post || post.status !== "published") {
        return res.status(404).json({
          success: false,
          message: "Post not found",
        });
      }

      // Find the comment
      const comment = await Comment.findById(commentId);
      if (!comment) {
        return res.status(404).json({
          success: false,
          message: "Comment not found",
        });
      }

      const hasLiked = comment.likedBy.includes(userId);

      if (hasLiked) {
        // Unlike the comment
        comment.likedBy = comment.likedBy.filter((id) => !id.equals(userId));
        comment.likes = Math.max(0, comment.likes - 1);
      } else {
        // Like the comment
        comment.likedBy.push(userId);
        comment.likes += 1;
      }

      await comment.save();

      res.status(200).json({
        success: true,
        message: hasLiked ? "Comment unliked" : "Comment liked",
        liked: !hasLiked,
        likes: comment.likes,
      });
    } catch (error) {
      console.error("Error toggling comment like:", error);
      res.status(500).json({
        success: false,
        message: "Server error toggling comment like",
      });
    }
  }

  // Like/unlike a reply (same as comment since replies are now comments)
  async toggleReplyLike(req, res) {
    try {
      const { postId, commentId, replyId } = req.params;
      const userId = req.user._id;

      // Check if post exists
      const post = await Post.findById(postId);
      if (!post || post.status !== "published") {
        return res.status(404).json({
          success: false,
          message: "Post not found",
        });
      }

      // Find the reply (which is just a comment)
      const reply = await Comment.findById(replyId);
      if (!reply) {
        return res.status(404).json({
          success: false,
          message: "Reply not found",
        });
      }

      const hasLiked = reply.likedBy.includes(userId);

      if (hasLiked) {
        // Unlike the reply
        reply.likedBy = reply.likedBy.filter((id) => !id.equals(userId));
        reply.likes = Math.max(0, reply.likes - 1);
      } else {
        // Like the reply
        reply.likedBy.push(userId);
        reply.likes += 1;
      }

      await reply.save();

      res.status(200).json({
        success: true,
        message: hasLiked ? "Reply unliked" : "Reply liked",
        liked: !hasLiked,
        likes: reply.likes,
      });
    } catch (error) {
      console.error("Error toggling reply like:", error);
      res.status(500).json({
        success: false,
        message: "Server error toggling reply like",
      });
    }
  }

  // Edit comment
  async editComment(req, res) {
    try {
      const { postId, commentId } = req.params;
      const { comment } = req.body;
      const userId = req.user._id;

      if (!comment || !comment.trim()) {
        return res.status(400).json({
          success: false,
          message: "Comment content is required",
        });
      }

      // Check if post exists
      const post = await Post.findById(postId);
      if (!post || post.status !== "published") {
        return res.status(404).json({
          success: false,
          message: "Post not found",
        });
      }

      // Find the comment to edit
      const commentToEdit = await Comment.findById(commentId);
      if (!commentToEdit) {
        return res.status(404).json({
          success: false,
          message: "Comment not found",
        });
      }

      // Check if the user is the author of the comment
      if (commentToEdit.user.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: "You can only edit your own comments",
        });
      }

      // Update the comment
      commentToEdit.comment = comment.trim();
      commentToEdit.updatedAt = new Date();
      await commentToEdit.save();

      // Populate the updated comment
      await commentToEdit.populate(
        "user",
        "firstName lastName username profileImage isVerified"
      );

      res.status(200).json({
        success: true,
        message: "Comment updated successfully",
        comment: commentToEdit,
      });
    } catch (error) {
      console.error("Error editing comment:", error);
      res.status(500).json({
        success: false,
        message: "Server error editing comment",
      });
    }
  }

  // Delete comment
  async deleteComment(req, res) {
    try {
      const { postId, commentId } = req.params;
      const userId = req.user._id;

      // Check if post exists
      const post = await Post.findById(postId);
      if (!post || post.status !== "published") {
        return res.status(404).json({
          success: false,
          message: "Post not found",
        });
      }

      // Find the comment to delete
      const commentToDelete = await Comment.findById(commentId);
      if (!commentToDelete) {
        return res.status(404).json({
          success: false,
          message: "Comment not found",
        });
      }

      // Check if the user is the author of the comment
      if (commentToDelete.user.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: "You can only delete your own comments",
        });
      }

      // Recursive function to delete all nested replies
      const deleteCommentsRecursively = async (commentId) => {
        const comment = await Comment.findById(commentId);
        if (!comment) return;

        // Delete all replies first
        if (comment.replies && comment.replies.length > 0) {
          for (const replyId of comment.replies) {
            await deleteCommentsRecursively(replyId);
          }
        }

        // Delete the comment itself
        await Comment.findByIdAndDelete(commentId);
      };

      // Count total comments being deleted (for user stats)
      const countCommentsRecursively = async (commentId) => {
        let count = 1; // Count the current comment
        const comment = await Comment.findById(commentId);
        if (comment && comment.replies && comment.replies.length > 0) {
          for (const replyId of comment.replies) {
            count += await countCommentsRecursively(replyId);
          }
        }
        return count;
      };

      const deletedCount = await countCommentsRecursively(commentId);

      // Remove comment from post's comments array if it's a top-level comment
      if (post.comments.includes(commentId)) {
        post.comments = post.comments.filter(
          (id) => id.toString() !== commentId.toString()
        );
        await post.save();
      } else {
        // If it's a reply, remove it from its parent comment
        const parentComment = await Comment.findOne({
          replies: commentId,
        });
        if (parentComment) {
          parentComment.replies = parentComment.replies.filter(
            (id) => id.toString() !== commentId.toString()
          );
          await parentComment.save();
        }
      }

      // Delete the comment and all its nested replies
      await deleteCommentsRecursively(commentId);

      // Update user's comment count
      await User.findByIdAndUpdate(userId, {
        $inc: { "stats.commentsCount": -deletedCount },
      });

      res.status(200).json({
        success: true,
        message: "Comment deleted successfully",
        deletedCount,
      });
    } catch (error) {
      console.error("Error deleting comment:", error);
      res.status(500).json({
        success: false,
        message: "Server error deleting comment",
      });
    }
  }
}

const commentController = new CommentController();

module.exports = {
  addComment: commentController.addComment.bind(commentController),
  addReply: commentController.addReply.bind(commentController),
  toggleCommentLike:
    commentController.toggleCommentLike.bind(commentController),
  toggleReplyLike: commentController.toggleReplyLike.bind(commentController),
  editComment: commentController.editComment.bind(commentController),
  deleteComment: commentController.deleteComment.bind(commentController),
};
