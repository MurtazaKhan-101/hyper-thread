const ChatRoom = require("../models/ChatRoom");
const { Post } = require("../models/Posts");
const User = require("../models/User");

class ChatRoomController {
  // Get or create chat room for a post
  async getChatRoom(req, res) {
    try {
      const { postId } = req.params;
      const userId = req.user._id;

      // Verify post exists
      const post = await Post.findById(postId);
      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Post not found",
        });
      }

      // Find existing chat room or create new one
      let chatRoom = await ChatRoom.findByPost(postId)
        .populate(
          "participants.user",
          "username firstName lastName profileImage"
        )
        .populate("messages.user", "username firstName lastName profileImage");

      if (!chatRoom) {
        chatRoom = new ChatRoom({
          post: postId,
          participants: [],
          messages: [],
          settings: {
            isActive: true,
            maxParticipants: 100,
            allowImages: true,
            moderationEnabled: false,
          },
        });
        await chatRoom.save();
      }

      // Manually populate replyTo data for messages
      let finalMessages = [];
      if (chatRoom && chatRoom.messages) {
        // Convert to plain object to allow modifications
        const messagesArray = chatRoom.messages.map((msg) =>
          msg.toObject ? msg.toObject() : msg
        );

        messagesArray.forEach((message) => {
          if (message.replyTo) {
            const referencedMessage = messagesArray.find(
              (msg) => msg._id.toString() === message.replyTo.toString()
            );
            if (referencedMessage) {
              message.replyTo = {
                _id: referencedMessage._id,
                content: referencedMessage.content,
                messageType: referencedMessage.messageType,
                imageUrl: referencedMessage.imageUrl,
                user: referencedMessage.user,
              };
            }
          }
        });

        finalMessages = messagesArray;
      }

      // Check if user is already a participant
      const isParticipant = chatRoom.isParticipant(userId);

      res.status(200).json({
        success: true,
        data: {
          chatRoom: {
            _id: chatRoom._id,
            post: chatRoom.post,
            participants: chatRoom.participants,
            messages: finalMessages.slice(-50), // Last 50 messages with populated replyTo
            settings: chatRoom.settings,
            stats: chatRoom.stats,
            isParticipant,
            createdAt: chatRoom.createdAt,
            lastActivity: chatRoom.lastActivity,
          },
        },
      });
    } catch (error) {
      console.error("Error getting chat room:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  // Join a chat room
  async joinChatRoom(req, res) {
    try {
      const { postId } = req.params;
      const userId = req.user._id;

      // Use atomic operation to find or create and update chat room
      let chatRoom = await ChatRoom.findOneAndUpdate(
        { post: postId },
        {
          $setOnInsert: {
            post: postId,
            participants: [],
            messages: [],
          },
        },
        {
          upsert: true,
          new: true,
          runValidators: true,
        }
      );

      // Check if room is at capacity
      if (chatRoom.participantCount >= chatRoom.settings.maxParticipants) {
        return res.status(400).json({
          success: false,
          message: "Chat room is at maximum capacity",
        });
      }

      // Use atomic operation to add participant
      const existingParticipant = chatRoom.participants.find(
        (p) => p.user.toString() === userId.toString()
      );

      if (!existingParticipant) {
        // Add new participant
        await ChatRoom.findByIdAndUpdate(
          chatRoom._id,
          {
            $push: {
              participants: {
                user: userId,
                joinedAt: new Date(),
                lastSeen: new Date(),
                isActive: true,
              },
            },
            $inc: { participantCount: 1 },
          },
          { new: true }
        );
      } else {
        // Update existing participant
        await ChatRoom.findOneAndUpdate(
          { _id: chatRoom._id, "participants.user": userId },
          {
            $set: {
              "participants.$.isActive": true,
              "participants.$.lastSeen": new Date(),
            },
          },
          { new: true }
        );
      }

      // Fetch updated chat room with populated data
      chatRoom = await ChatRoom.findById(chatRoom._id).populate(
        "participants.user",
        "username firstName lastName profileImage"
      );

      res.status(200).json({
        success: true,
        message: "Successfully joined chat room",
        data: {
          participantCount: chatRoom.participantCount,
          participants: chatRoom.participants.filter((p) => p.isActive),
        },
      });
    } catch (error) {
      console.error("Error joining chat room:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  // Leave a chat room
  async leaveChatRoom(req, res) {
    try {
      const { postId } = req.params;
      const userId = req.user._id;

      // Use atomic operation to update participant status
      const chatRoom = await ChatRoom.findOneAndUpdate(
        { post: postId, "participants.user": userId },
        {
          $set: {
            "participants.$.isActive": false,
            "participants.$.lastSeen": new Date(),
          },
          $inc: { participantCount: -1 },
        },
        { new: true }
      );

      if (!chatRoom) {
        return res.status(404).json({
          success: false,
          message: "Chat room not found or user not in room",
        });
      }

      res.status(200).json({
        success: true,
        message: "Successfully left chat room",
        data: {
          participantCount: chatRoom.participantCount,
        },
      });
    } catch (error) {
      console.error("Error leaving chat room:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  // Get chat history with pagination
  async getChatHistory(req, res) {
    try {
      const { postId } = req.params;
      const { page = 1, limit = 50, before } = req.query;
      const userId = req.user._id;

      const chatRoom = await ChatRoom.findByPost(postId);

      if (!chatRoom) {
        return res.status(404).json({
          success: false,
          message: "Chat room not found",
        });
      }

      // Check if user is participant
      if (!chatRoom.isParticipant(userId)) {
        return res.status(403).json({
          success: false,
          message: "You must join the chat room to view messages",
        });
      }

      let messages = chatRoom.messages;

      // Filter messages before a certain timestamp if provided
      if (before) {
        const beforeDate = new Date(before);
        messages = messages.filter((msg) => msg.timestamp < beforeDate);
      }

      // Sort by timestamp (newest first for pagination, then reverse)
      messages = messages.sort((a, b) => b.timestamp - a.timestamp);

      // Paginate
      const startIndex = (page - 1) * limit;
      const paginatedMessages = messages.slice(
        startIndex,
        startIndex + parseInt(limit)
      );

      // Reverse to show chronological order (oldest first)
      paginatedMessages.reverse();

      // Populate user data
      await ChatRoom.populate(paginatedMessages, {
        path: "user",
        select: "username firstName lastName profileImage",
      });

      // Also populate user data for all messages in chatRoom for replyTo resolution
      await ChatRoom.populate(chatRoom.messages, {
        path: "user",
        select: "username firstName lastName profileImage",
      });

      // Manually populate replyTo data for paginated messages
      const allMessagesArray = chatRoom.messages.map((msg) =>
        msg.toObject ? msg.toObject() : msg
      );
      const paginatedMessagesArray = paginatedMessages.map((msg) =>
        msg.toObject ? msg.toObject() : msg
      );

      paginatedMessagesArray.forEach((message) => {
        if (message.replyTo) {
          const referencedMessage = allMessagesArray.find(
            (msg) => msg._id.toString() === message.replyTo.toString()
          );
          if (referencedMessage) {
            message.replyTo = {
              _id: referencedMessage._id,
              content: referencedMessage.content,
              messageType: referencedMessage.messageType,
              imageUrl: referencedMessage.imageUrl,
              user: referencedMessage.user,
            };
            console.log(
              "Populated replyTo in pagination for message:",
              message._id,
              "with user:",
              referencedMessage.user
            );
          }
        }
      });

      res.status(200).json({
        success: true,
        data: {
          messages: paginatedMessagesArray,
          pagination: {
            currentPage: parseInt(page),
            totalMessages: messages.length,
            hasMore: startIndex + parseInt(limit) < messages.length,
          },
        },
      });
    } catch (error) {
      console.error("Error getting chat history:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  // Update last seen timestamp
  async updateLastSeen(req, res) {
    try {
      const { postId } = req.params;
      const userId = req.user._id;

      const chatRoom = await ChatRoom.findByPost(postId);

      if (!chatRoom) {
        return res.status(404).json({
          success: false,
          message: "Chat room not found",
        });
      }

      chatRoom.updateLastSeen(userId);
      await chatRoom.save();

      res.status(200).json({
        success: true,
        message: "Last seen updated",
      });
    } catch (error) {
      console.error("Error updating last seen:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  // Get chat room participants
  async getParticipants(req, res) {
    try {
      const { postId } = req.params;

      const chatRoom = await ChatRoom.findByPost(postId).populate(
        "participants.user",
        "username firstName lastName profileImage isVerified"
      );

      if (!chatRoom) {
        return res.status(404).json({
          success: false,
          message: "Chat room not found",
        });
      }

      const activeParticipants = chatRoom.participants
        .filter((p) => p.isActive)
        .sort((a, b) => b.lastSeen - a.lastSeen);

      res.status(200).json({
        success: true,
        data: {
          participants: activeParticipants,
          count: activeParticipants.length,
          maxParticipants: chatRoom.settings.maxParticipants,
        },
      });
    } catch (error) {
      console.error("Error getting participants:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  // Get active chat rooms (for admin or discovery)
  async getActiveChatRooms(req, res) {
    try {
      const { page = 1, limit = 20 } = req.query;

      const chatRooms = await ChatRoom.getActiveRooms()
        .populate("post", "title author category")
        .populate("post.author", "username firstName lastName")
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const totalRooms = await ChatRoom.countDocuments({
        "settings.isActive": true,
        "stats.activeParticipants": { $gt: 0 },
      });

      res.status(200).json({
        success: true,
        data: {
          chatRooms: chatRooms.map((room) => ({
            _id: room._id,
            post: room.post,
            stats: room.stats,
            lastActivity: room.lastActivity,
            participantCount: room.participantCount,
          })),
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalRooms / limit),
            totalRooms,
            hasMore: page * limit < totalRooms,
          },
        },
      });
    } catch (error) {
      console.error("Error getting active chat rooms:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }

  // Add reaction to message
  async addReaction(req, res) {
    try {
      const { postId, messageId } = req.params;
      const { emoji } = req.body;
      const userId = req.user._id;

      if (!emoji) {
        return res.status(400).json({
          success: false,
          message: "Emoji is required",
        });
      }

      const chatRoom = await ChatRoom.findByPost(postId);

      if (!chatRoom) {
        return res.status(404).json({
          success: false,
          message: "Chat room not found",
        });
      }

      const message = chatRoom.messages.id(messageId);
      if (!message) {
        return res.status(404).json({
          success: false,
          message: "Message not found",
        });
      }

      // Check if user already reacted with this emoji
      const existingReaction = message.reactions.find(
        (r) => r.user.toString() === userId.toString() && r.emoji === emoji
      );

      if (existingReaction) {
        // Remove reaction
        message.reactions.pull(existingReaction._id);
      } else {
        // Add reaction
        message.reactions.push({
          user: userId,
          emoji,
          timestamp: new Date(),
        });
      }

      await chatRoom.save();

      res.status(200).json({
        success: true,
        message: existingReaction ? "Reaction removed" : "Reaction added",
        data: {
          reactions: message.reactions,
        },
      });
    } catch (error) {
      console.error("Error adding reaction:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }
}

module.exports = new ChatRoomController();
