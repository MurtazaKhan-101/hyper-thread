const express = require("express");
const chatRoomController = require("../controllers/chatRoomController");
const { authenticate } = require("../middleware/auth");
const { upload, uploadChatImage } = require("../middleware/chatUpload");

const router = express.Router();

// All chat room routes require authentication
router.use(authenticate);

// Get or create chat room for a specific post
router.get("/:postId", chatRoomController.getChatRoom);

// Note: Join/Leave operations are now handled via Socket.IO only to prevent duplicate requests
// Join a chat room
// router.post("/:postId/join", chatRoomController.joinChatRoom);

// Leave a chat room
// router.post("/:postId/leave", chatRoomController.leaveChatRoom);

// Get chat history with pagination
router.get("/:postId/messages", chatRoomController.getChatHistory);

// Update last seen timestamp
router.put("/:postId/last-seen", chatRoomController.updateLastSeen);

// Get chat room participants
router.get("/:postId/participants", chatRoomController.getParticipants);

// Get active chat rooms (discovery)
router.get("/", chatRoomController.getActiveChatRooms);

// Add/remove reaction to a message
router.post(
  "/:postId/messages/:messageId/reaction",
  chatRoomController.addReaction
);

// Upload image for chat
router.post("/:postId/upload-image", upload, uploadChatImage, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Image uploaded successfully",
    data: {
      imageUrl: req.imageUrl,
    },
  });
});

module.exports = router;
