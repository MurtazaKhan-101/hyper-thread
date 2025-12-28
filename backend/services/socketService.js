const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ChatRoom = require("../models/ChatRoom");

class SocketService {
  constructor(io) {
    this.io = io;
    this.connectedUsers = new Map(); // userId -> socketId
    this.userSockets = new Map(); // socketId -> userId
    this.roomParticipants = new Map(); // roomId -> Set of userIds
    this.recentRoomJoins = new Map(); // Track recent room joins to prevent spam

    // Start periodic cleanup
    this.startPeriodicCleanup();
    this.initializeSocketHandlers();
  }

  // Periodic cleanup of stale data
  startPeriodicCleanup() {
    setInterval(() => {
      this.cleanupStaleData();
    }, 5 * 60 * 1000); // Run every 5 minutes
  }

  async cleanupStaleData() {
    console.log("🧹 Running periodic cleanup...");

    // Clean up old room join tracking (older than 5 minutes)
    const now = Date.now();
    for (const [key, timestamp] of this.recentRoomJoins.entries()) {
      if (now - timestamp > 300000) {
        this.recentRoomJoins.delete(key);
      }
    }

    // Clean up disconnected users from room tracking
    for (const [roomId, participants] of this.roomParticipants.entries()) {
      const activeParticipants = new Set();
      for (const userId of participants) {
        if (this.connectedUsers.has(userId)) {
          activeParticipants.add(userId);
        }
      }

      if (activeParticipants.size === 0) {
        this.roomParticipants.delete(roomId);
      } else if (activeParticipants.size !== participants.size) {
        this.roomParticipants.set(roomId, activeParticipants);
      }
    }

    console.log(
      `🧹 Cleanup complete. Active rooms: ${this.roomParticipants.size}, Connected users: ${this.connectedUsers.size}`
    );
  }

  // Middleware to authenticate socket connections
  async authenticateSocket(socket, next) {
    try {
      const token =
        socket.handshake.auth.token ||
        socket.handshake.headers.authorization?.replace("Bearer ", "");

      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");

      if (!user || !user.isVerified) {
        return next(new Error("Authentication error: Invalid user"));
      }

      // Check if user has premium access for chat
      if (!user.isPremium) {
        return next(
          new Error("Premium subscription required to access chat rooms")
        );
      }

      // Check if premium has expired
      if (user.premiumExpiresAt && user.premiumExpiresAt < new Date()) {
        return next(new Error("Premium subscription has expired"));
      }

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (error) {
      next(new Error("Authentication error: Invalid token"));
    }
  }

  initializeSocketHandlers() {
    // Authentication middleware
    this.io.use(this.authenticateSocket.bind(this));

    this.io.on("connection", (socket) => {
      // console.log(
      //   `👤 User ${socket.user.username} connected with socket ${socket.id}`
      // );

      // Store user connection
      this.connectedUsers.set(socket.userId, socket.id);
      this.userSockets.set(socket.id, socket.userId);

      // Socket event handlers
      this.handleJoinRoom(socket);
      this.handleLeaveRoom(socket);
      this.handleSendMessage(socket);
      this.handleTypingStart(socket);
      this.handleTypingStop(socket);
      this.handleMessageReaction(socket);
      this.handleEditMessage(socket);
      this.handleDeleteMessage(socket);
      this.handleDisconnect(socket);
    });
  }

  handleJoinRoom(socket) {
    socket.on("joinRoom", async (data) => {
      try {
        const { postId } = data;
        const userId = socket.userId;
        const roomId = `post_${postId}`;
        const joinKey = `${userId}_${postId}`;

        // console.log(`👤 ${socket.user.username} joining room ${roomId}`);

        // Rate limiting: prevent rapid join attempts
        const now = Date.now();
        const lastJoin = this.recentRoomJoins.get(joinKey);
        if (lastJoin && now - lastJoin < 3000) {
          // 3 second cooldown to match frontend
          console.log(`⚠️ Rate limiting room join for ${socket.user.username}`);
          return;
        }
        this.recentRoomJoins.set(joinKey, now);

        // Use atomic operation to find or create chat room
        let chatRoom = await ChatRoom.findOneAndUpdate(
          { post: postId },
          {
            $setOnInsert: {
              post: postId,
              participants: [],
              messages: [],
              participantCount: 0,
            },
          },
          {
            upsert: true,
            new: true,
            runValidators: true,
          }
        );

        // Use atomic operation to add participant
        const existingParticipant = chatRoom.participants.find(
          (p) => p && p.user && p.user.toString() === userId.toString()
        );

        if (!existingParticipant) {
          // Add new participant
          chatRoom = await ChatRoom.findByIdAndUpdate(
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
          // Update existing participant only if they're not already active
          if (!existingParticipant.isActive) {
            chatRoom = await ChatRoom.findOneAndUpdate(
              { _id: chatRoom._id, "participants.user": userId },
              {
                $set: {
                  "participants.$.isActive": true,
                  "participants.$.lastSeen": new Date(),
                },
                $inc: { participantCount: 1 },
              },
              { new: true }
            );
          }
        }

        // Join socket room
        socket.join(roomId);

        // Track room participants
        if (!this.roomParticipants.has(roomId)) {
          this.roomParticipants.set(roomId, new Set());
        }
        this.roomParticipants.get(roomId).add(userId);

        // Populate user data for the new participant
        await chatRoom.populate(
          "participants.user",
          "username firstName lastName profileImage"
        );

        // Notify room about new participant
        const participant = chatRoom.participants.find(
          (p) => p && p.user && p.user._id.toString() === userId
        );

        if (participant && participant.user) {
          socket.to(roomId).emit("userJoined", {
            user: participant.user,
            participantCount: chatRoom.participantCount,
            timestamp: new Date(),
          });
        }

        // Send confirmation to the joining user
        socket.emit("joinedRoom", {
          roomId,
          participantCount: chatRoom.participantCount,
          participants: chatRoom.participants.filter(
            (p) => p && p.user && p.isActive
          ),
        });

        // Notify room about new participant (without system message)
        socket.to(roomId).emit("userJoined", {
          userId,
          username: socket.user.username,
          user: socket.user,
          participantCount: chatRoom.participantCount,
          timestamp: new Date(),
        });
      } catch (error) {
        console.error("Error joining room:", error);
        socket.emit("error", {
          message: "Failed to join room",
          error: error.message,
        });
      }
    });
  }

  handleLeaveRoom(socket) {
    socket.on("leaveRoom", async (data) => {
      try {
        const { postId } = data;
        const userId = socket.userId;
        const roomId = `post_${postId}`;

        // console.log(`👤 ${socket.user.username} leaving room ${roomId}`);

        // Use atomic operation to update participant status
        const chatRoom = await ChatRoom.findOneAndUpdate(
          {
            post: postId,
            "participants.user": userId,
            "participants.isActive": true, // Only update if user is currently active
          },
          {
            $set: {
              "participants.$.isActive": false,
              "participants.$.lastSeen": new Date(),
            },
            $inc: { participantCount: -1 },
          },
          { new: true }
        );

        if (chatRoom) {
          // Ensure participant count doesn't go below 0
          if (chatRoom.participantCount < 0) {
            await ChatRoom.findByIdAndUpdate(chatRoom._id, {
              $set: { participantCount: 0 },
            });
          }

          // Notify room about user leaving (without system message)
          socket.to(roomId).emit("userLeft", {
            userId,
            username: socket.user.username,
            participantCount: Math.max(0, chatRoom.participantCount),
            timestamp: new Date(),
          });
        }

        // Leave socket room
        socket.leave(roomId);

        // Remove from room participants tracking
        if (this.roomParticipants.has(roomId)) {
          this.roomParticipants.get(roomId).delete(userId);
          if (this.roomParticipants.get(roomId).size === 0) {
            this.roomParticipants.delete(roomId);
          }
        }

        socket.emit("leftRoom", { roomId });
      } catch (error) {
        console.error("Error leaving room:", error);
        socket.emit("error", {
          message: "Failed to leave room",
          error: error.message,
        });
      }
    });
  }

  handleSendMessage(socket) {
    socket.on("sendMessage", async (data) => {
      try {
        const {
          postId,
          content,
          messageType = "text",
          imageUrl = null,
          replyTo = null,
        } = data;
        const userId = socket.userId;
        const roomId = `post_${postId}`;

        // For image messages, content is optional (caption)
        // For text messages, content is required
        if (
          messageType === "text" &&
          (!content || content.trim().length === 0)
        ) {
          socket.emit("error", { message: "Message content is required" });
          return;
        }

        // Ensure content is a string for processing
        const messageContent = content || "";

        if (messageContent.length > 1000) {
          socket.emit("error", { message: "Message too long" });
          return;
        }

        // Find chat room
        const chatRoom = await ChatRoom.findByPost(postId);
        if (!chatRoom) {
          socket.emit("error", { message: "Chat room not found" });
          return;
        }

        // Check if user is participant
        if (!chatRoom.isParticipant(userId)) {
          socket.emit("error", {
            message: "You must join the room to send messages",
          });
          return;
        }

        // Add message using atomic operation
        const updatedChatRoom = await ChatRoom.findByIdAndUpdate(
          chatRoom._id,
          {
            $push: {
              messages: {
                user: userId,
                content: messageContent.trim(),
                messageType,
                imageUrl,
                replyTo,
                timestamp: new Date(),
              },
            },
          },
          { new: true }
        ).populate("messages.user", "username firstName lastName profileImage");

        // Create populated message for broadcasting
        const newMessage =
          updatedChatRoom.messages[updatedChatRoom.messages.length - 1];

        // Populate replyTo if it exists
        let replyToData = null;
        if (replyTo) {
          try {
            const originalMessage = updatedChatRoom.messages.find(
              (msg) => msg._id.toString() === replyTo
            );
            if (originalMessage) {
              replyToData = {
                _id: originalMessage._id,
                content: originalMessage.content,
                messageType: originalMessage.messageType,
                imageUrl: originalMessage.imageUrl,
                user: originalMessage.user, // This should now be populated
              };
            }
          } catch (err) {
            console.error("Error populating replyTo:", err);
          }
        }

        const populatedMessage = {
          ...newMessage.toObject(),
          user: {
            _id: socket.user._id,
            username: socket.user.username,
            firstName: socket.user.firstName,
            lastName: socket.user.lastName,
            profileImage: socket.user.profileImage,
          },
          replyTo: replyToData,
        };

        // Broadcast message to all room participants
        this.io.to(roomId).emit("newMessage", {
          message: populatedMessage,
          roomId,
        });
      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("error", {
          message: "Failed to send message",
          error: error.message,
        });
      }
    });
  }

  handleTypingStart(socket) {
    socket.on("typingStart", (data) => {
      const { postId } = data;
      const roomId = `post_${postId}`;

      socket.to(roomId).emit("userTyping", {
        userId: socket.userId,
        username: socket.user.username,
        isTyping: true,
      });
    });
  }

  handleTypingStop(socket) {
    socket.on("typingStop", (data) => {
      const { postId } = data;
      const roomId = `post_${postId}`;

      socket.to(roomId).emit("userTyping", {
        userId: socket.userId,
        username: socket.user.username,
        isTyping: false,
      });
    });
  }

  handleMessageReaction(socket) {
    socket.on("addReaction", async (data) => {
      try {
        const { postId, messageId, emoji } = data;
        const userId = socket.userId;
        const roomId = `post_${postId}`;

        const chatRoom = await ChatRoom.findByPost(postId);
        if (!chatRoom) {
          socket.emit("error", { message: "Chat room not found" });
          return;
        }

        const message = chatRoom.messages.id(messageId);
        if (!message) {
          socket.emit("error", { message: "Message not found" });
          return;
        }

        // Check if user already reacted with this emoji
        const existingReaction = message.reactions.find(
          (r) => r.user.toString() === userId && r.emoji === emoji
        );

        let updatedReactions;
        if (existingReaction) {
          // Remove reaction using atomic operation
          const reactionIndex = message.reactions.indexOf(existingReaction);
          await ChatRoom.updateOne(
            { _id: chatRoom._id, "messages._id": messageId },
            { $pull: { "messages.$.reactions": { _id: existingReaction._id } } }
          );
          updatedReactions = message.reactions.filter(
            (r) => r._id.toString() !== existingReaction._id.toString()
          );
        } else {
          // Add reaction using atomic operation
          const newReaction = {
            user: userId,
            emoji,
            timestamp: new Date(),
          };
          await ChatRoom.updateOne(
            { _id: chatRoom._id, "messages._id": messageId },
            { $push: { "messages.$.reactions": newReaction } }
          );
          updatedReactions = [...message.reactions, newReaction];
        }

        // Broadcast reaction update
        this.io.to(roomId).emit("reactionUpdate", {
          messageId,
          reactions: updatedReactions,
          roomId,
        });
      } catch (error) {
        console.error("Error handling reaction:", error);
        socket.emit("error", {
          message: "Failed to add reaction",
          error: error.message,
        });
      }
    });
  }

  handleDisconnect(socket) {
    socket.on("disconnect", async () => {
      const userId = socket.userId;
      // console.log(`👤 User ${socket.user?.username} disconnected`);

      // Remove from tracking maps
      this.connectedUsers.delete(userId);
      this.userSockets.delete(socket.id);

      // Remove from all room participants and update chat rooms
      for (const [roomId, participants] of this.roomParticipants.entries()) {
        if (participants.has(userId)) {
          participants.delete(userId);

          // Extract postId from roomId (format: "post_${postId}")
          const postId = roomId.replace("post_", "");

          try {
            // Use atomic operation to update participant status on disconnect
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

            if (chatRoom) {
              // Notify room about user disconnecting
              socket.to(roomId).emit("userLeft", {
                userId,
                username: socket.user?.username,
                participantCount: Math.max(0, chatRoom.participantCount),
                timestamp: new Date(),
              });
            }
          } catch (error) {
            console.error("Error updating chat room on disconnect:", error);
          }

          if (participants.size === 0) {
            this.roomParticipants.delete(roomId);
          }
        }
      }
    });
  }

  // Utility method to send message to specific user
  sendToUser(userId, event, data) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
      return true;
    }
    return false;
  }

  // Utility method to get online users in a room
  getOnlineUsersInRoom(roomId) {
    const participants = this.roomParticipants.get(roomId);
    return participants ? Array.from(participants) : [];
  }

  // Utility method to get total connected users
  getConnectedUsersCount() {
    return this.connectedUsers.size;
  }

  // Handle edit message
  handleEditMessage(socket) {
    socket.on("editMessage", async (data) => {
      try {
        const { postId, messageId, content } = data;
        const userId = socket.userId;
        const roomId = `post_${postId}`;

        if (!content || content.trim().length === 0) {
          socket.emit("error", { message: "Message content is required" });
          return;
        }

        if (content.length > 1000) {
          socket.emit("error", { message: "Message too long" });
          return;
        }

        // Find chat room and message
        const chatRoom = await ChatRoom.findOne({
          post: postId,
          "messages._id": messageId,
          "messages.user": userId, // Only allow editing own messages
        });

        if (!chatRoom) {
          socket.emit("error", {
            message: "Message not found or not authorized",
          });
          return;
        }

        // Update message using atomic operation
        const result = await ChatRoom.findOneAndUpdate(
          { post: postId, "messages._id": messageId, "messages.user": userId },
          {
            $set: {
              "messages.$.content": content.trim(),
              "messages.$.edited": true,
              "messages.$.editedAt": new Date(),
            },
          },
          { new: true }
        );

        if (result) {
          // Find the updated message
          const updatedMessage = result.messages.id(messageId);

          // Broadcast the edit to all users in the room
          this.io.to(roomId).emit("messageEdited", {
            messageId,
            content: content.trim(),
            edited: true,
            editedAt: updatedMessage.editedAt,
            roomId,
          });

          console.log(`✏️ ${socket.user.username} edited message in ${roomId}`);
        }
      } catch (error) {
        console.error("Error editing message:", error);
        socket.emit("error", { message: "Failed to edit message" });
      }
    });
  }

  // Handle delete message
  handleDeleteMessage(socket) {
    socket.on("deleteMessage", async (data) => {
      try {
        const { postId, messageId } = data;
        const userId = socket.userId;
        const roomId = `post_${postId}`;

        // Find chat room and message
        const chatRoom = await ChatRoom.findOne({
          post: postId,
          "messages._id": messageId,
          "messages.user": userId, // Only allow deleting own messages
        });

        if (!chatRoom) {
          socket.emit("error", {
            message: "Message not found or not authorized",
          });
          return;
        }

        // Remove message using atomic operation
        const result = await ChatRoom.findOneAndUpdate(
          { post: postId },
          {
            $pull: {
              messages: { _id: messageId, user: userId },
            },
          },
          { new: true }
        );

        if (result) {
          // Broadcast the deletion to all users in the room
          this.io.to(roomId).emit("messageDeleted", {
            messageId,
            roomId,
          });

          console.log(
            `🗑️ ${socket.user.username} deleted message in ${roomId}`
          );
        }
      } catch (error) {
        console.error("Error deleting message:", error);
        socket.emit("error", { message: "Failed to delete message" });
      }
    });
  }
}

module.exports = SocketService;
