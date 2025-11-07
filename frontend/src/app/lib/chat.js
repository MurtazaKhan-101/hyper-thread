import io from "socket.io-client";
import apiClient from "./api";
import { API_ENDPOINTS, API_BASE_URL } from "./constants";

class ChatService {
  constructor() {
    this.socket = null;
    this.currentRoom = null;
    this.isConnected = false;
    this.connectionCallbacks = [];
    this.messageCallbacks = [];
    this.userEventCallbacks = [];
    // this.typingCallbacks = [];
    this.reactionCallbacks = [];
    this.messageEditCallbacks = [];
    this.messageDeleteCallbacks = [];
    this.errorCallbacks = [];
  }

  // Initialize socket connection
  connect(token) {
    console.log("🔌 ChatService: Attempting to connect...");

    if (this.socket && this.isConnected) {
      console.log("✅ ChatService: Already connected");
      return Promise.resolve();
    }

    // Disconnect any existing connection first
    if (this.socket) {
      console.log("🔄 ChatService: Cleaning up existing connection...");
      this.socket.disconnect();
      this.socket = null;
    }

    return new Promise((resolve, reject) => {
      try {
        console.log("🚀 ChatService: Creating new socket connection...");
        this.socket = io(API_BASE_URL, {
          auth: {
            token: token,
          },
          transports: ["websocket", "polling"],
          timeout: 20000,
          autoConnect: true,
          forceNew: true, // Force a new connection
        });

        this.setupEventListeners();

        this.socket.on("connect", () => {
          console.log("✅ ChatService: Connected to chat server");
          this.isConnected = true;
          this.connectionCallbacks.forEach((callback) => callback(true));
          resolve();
        });

        this.socket.on("connect_error", (error) => {
          console.error("❌ ChatService: Socket connection error:", error);
          this.isConnected = false;
          this.connectionCallbacks.forEach((callback) => callback(false));
          reject(error);
        });

        this.socket.on("disconnect", () => {
          console.log("❌ ChatService: Disconnected from chat server");
          this.isConnected = false;
          this.connectionCallbacks.forEach((callback) => callback(false));
        });

        // Add a timeout to reject if connection takes too long
        const connectionTimeout = setTimeout(() => {
          if (!this.isConnected) {
            console.error("⏰ ChatService: Connection timeout");
            reject(new Error("Connection timeout"));
          }
        }, 25000);

        // Clear timeout on successful connection
        this.socket.on("connect", () => {
          clearTimeout(connectionTimeout);
        });
      } catch (error) {
        console.error("💥 ChatService: Socket initialization error:", error);
        reject(error);
      }
    });
  }

  // Setup socket event listeners
  setupEventListeners() {
    if (!this.socket) return;

    // Chat room events
    this.socket.on("joinedRoom", (data) => {
      console.log("Joined room:", data);
      this.userEventCallbacks.forEach((callback) =>
        callback({ type: "joinedRoom", data })
      );
    });

    this.socket.on("leftRoom", (data) => {
      console.log("Left room:", data);
      this.userEventCallbacks.forEach((callback) =>
        callback({ type: "leftRoom", data })
      );
    });

    // Message events
    this.socket.on("newMessage", (data) => {
      console.log("New message:", data);
      this.messageCallbacks.forEach((callback) => callback(data));
    });

    // User events
    this.socket.on("userJoined", (data) => {
      console.log("User joined:", data);
      this.userEventCallbacks.forEach((callback) =>
        callback({ type: "userJoined", data })
      );
    });

    this.socket.on("userLeft", (data) => {
      console.log("User left:", data);
      this.userEventCallbacks.forEach((callback) =>
        callback({ type: "userLeft", data })
      );
    });

    // Typing events
    // this.socket.on("userTyping", (data) => {
    //   this.typingCallbacks.forEach((callback) => callback(data));
    // });

    // Reaction events
    this.socket.on("reactionUpdate", (data) => {
      this.reactionCallbacks.forEach((callback) => callback(data));
    });

    // Message edit events
    this.socket.on("messageEdited", (data) => {
      this.messageEditCallbacks.forEach((callback) => callback(data));
    });

    // Message delete events
    this.socket.on("messageDeleted", (data) => {
      this.messageDeleteCallbacks.forEach((callback) => callback(data));
    });

    // Error events
    this.socket.on("error", (error) => {
      console.error("Socket error:", error?.message || error?.type || error);
      this.errorCallbacks.forEach((callback) => callback(error));
    });
  }

  // Join a chat room
  joinRoom(postId) {
    if (!this.isConnected || !this.socket) {
      console.error("Not connected to chat server");
      return Promise.reject(new Error("Not connected"));
    }

    // Prevent duplicate joins to the same room
    if (this.currentRoom === postId) {
      console.log("Already in room:", postId);
      return Promise.resolve({ roomId: `post_${postId}` });
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Join room timeout"));
      }, 10000); // 10 second timeout

      this.currentRoom = postId;
      this.socket.emit("joinRoom", { postId });

      // Listen for join confirmation
      const handleJoinConfirm = (data) => {
        if (
          data.type === "joinedRoom" &&
          data.data.roomId === `post_${postId}`
        ) {
          clearTimeout(timeout);
          this.socket.off("userEvent", handleJoinConfirm);
          resolve(data.data);
        }
      };

      this.onUserEvent(handleJoinConfirm);
    });
  }

  // Leave current room
  leaveRoom() {
    if (!this.isConnected || !this.currentRoom || !this.socket) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        resolve(); // Don't reject on timeout for leave operations
      }, 5000); // 5 second timeout

      const postId = this.currentRoom;
      this.socket.emit("leaveRoom", { postId });

      const handleLeaveConfirm = (data) => {
        if (data.type === "leftRoom") {
          clearTimeout(timeout);
          this.socket.off("userEvent", handleLeaveConfirm);
          this.currentRoom = null;
          resolve();
        }
      };

      this.onUserEvent(handleLeaveConfirm);
    });
  }

  // Send a text message
  sendMessage(content) {
    if (!this.isConnected || !this.currentRoom || !this.socket) {
      console.error("Not connected or not in a room");
      return;
    }

    this.socket.emit("sendMessage", {
      postId: this.currentRoom,
      content,
      messageType: "text",
    });
  }

  // Send an image message
  sendImageMessage(imageUrl, caption = "") {
    if (!this.isConnected || !this.currentRoom || !this.socket) {
      console.error("Not connected or not in a room");
      return;
    }

    this.socket.emit("sendMessage", {
      postId: this.currentRoom,
      content: caption,
      messageType: "image",
      imageUrl,
    });
  }

  // Start typing indicator
  //   startTyping() {
  //     if (!this.isConnected || !this.currentRoom || !this.socket) return;

  //     this.socket.emit("typingStart", { postId: this.currentRoom });
  //   }

  // Stop typing indicator
  //   stopTyping() {
  //     if (!this.isConnected || !this.currentRoom || !this.socket) return;

  //     this.socket.emit("typingStop", { postId: this.currentRoom });
  //   }

  // Add reaction to message
  addReaction(messageId, emoji) {
    if (!this.isConnected || !this.currentRoom || !this.socket) return;

    this.socket.emit("addReaction", {
      postId: this.currentRoom,
      messageId,
      emoji,
    });
  }

  // Send a reply message
  sendReply(content, replyToMessageId) {
    if (!this.isConnected || !this.currentRoom || !this.socket) {
      console.error("Not connected or not in a room");
      return;
    }

    this.socket.emit("sendMessage", {
      postId: this.currentRoom,
      content,
      messageType: "text",
      replyTo: replyToMessageId,
    });
  }

  // Edit a message
  editMessage(messageId, content) {
    if (!this.isConnected || !this.currentRoom || !this.socket) {
      console.error("Not connected or not in a room");
      return;
    }

    this.socket.emit("editMessage", {
      postId: this.currentRoom,
      messageId,
      content,
    });
  }

  // Delete a message
  deleteMessage(messageId) {
    if (!this.isConnected || !this.currentRoom || !this.socket) {
      console.error("Not connected or not in a room");
      return;
    }

    this.socket.emit("deleteMessage", {
      postId: this.currentRoom,
      messageId,
    });
  }

  // Event subscription methods
  onConnection(callback) {
    this.connectionCallbacks.push(callback);
    return () => {
      this.connectionCallbacks = this.connectionCallbacks.filter(
        (cb) => cb !== callback
      );
    };
  }

  onNewMessage(callback) {
    this.messageCallbacks.push(callback);
    return () => {
      this.messageCallbacks = this.messageCallbacks.filter(
        (cb) => cb !== callback
      );
    };
  }

  onUserEvent(callback) {
    this.userEventCallbacks.push(callback);
    return () => {
      this.userEventCallbacks = this.userEventCallbacks.filter(
        (cb) => cb !== callback
      );
    };
  }

  //   onTyping(callback) {
  //     this.typingCallbacks.push(callback);
  //     return () => {
  //       this.typingCallbacks = this.typingCallbacks.filter(
  //         (cb) => cb !== callback
  //       );
  //     };
  //   }

  onReaction(callback) {
    this.reactionCallbacks.push(callback);
    return () => {
      this.reactionCallbacks = this.reactionCallbacks.filter(
        (cb) => cb !== callback
      );
    };
  }

  onMessageEdit(callback) {
    this.messageEditCallbacks.push(callback);
    return () => {
      this.messageEditCallbacks = this.messageEditCallbacks.filter(
        (cb) => cb !== callback
      );
    };
  }

  onMessageDelete(callback) {
    this.messageDeleteCallbacks.push(callback);
    return () => {
      this.messageDeleteCallbacks = this.messageDeleteCallbacks.filter(
        (cb) => cb !== callback
      );
    };
  }

  onError(callback) {
    this.errorCallbacks.push(callback);
    return () => {
      this.errorCallbacks = this.errorCallbacks.filter((cb) => cb !== callback);
    };
  }

  // REST API methods
  async getChatRoom(postId) {
    try {
      const response = await apiClient.get(
        `${API_ENDPOINTS.GET_CHAT_ROOM}/${postId}`
      );
      return response;
    } catch (error) {
      console.error("Error getting chat room:", error);
      throw error;
    }
  }

  async getChatHistory(postId, page = 1, limit = 50, before = null) {
    try {
      let url = `${API_ENDPOINTS.GET_CHAT_HISTORY}/${postId}/messages?page=${page}&limit=${limit}`;
      if (before) {
        url += `&before=${before}`;
      }

      const response = await apiClient.get(url);
      return response;
    } catch (error) {
      console.error("Error getting chat history:", error);
      throw error;
    }
  }

  async getParticipants(postId) {
    try {
      const response = await apiClient.get(
        `${API_ENDPOINTS.GET_CHAT_PARTICIPANTS}/${postId}/participants`
      );
      return response;
    } catch (error) {
      console.error("Error getting participants:", error);
      throw error;
    }
  }

  async updateLastSeen(postId) {
    try {
      const response = await apiClient.put(
        `${API_ENDPOINTS.UPDATE_LAST_SEEN}/${postId}/last-seen`
      );
      return response;
    } catch (error) {
      console.error("Error updating last seen:", error);
      throw error;
    }
  }

  async addMessageReaction(postId, messageId, emoji) {
    try {
      const response = await apiClient.post(
        `${API_ENDPOINTS.ADD_MESSAGE_REACTION}/${postId}/messages/${messageId}/reaction`,
        { emoji }
      );
      return response;
    } catch (error) {
      console.error("Error adding reaction:", error);
      throw error;
    }
  }

  async uploadChatImage(postId, file) {
    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await apiClient.request(
        `${API_ENDPOINTS.UPLOAD_CHAT_IMAGE}/${postId}/upload-image`,
        {
          method: "POST",
          body: formData,
        }
      );

      return response;
    } catch (error) {
      console.error("Error uploading chat image:", error);
      throw error;
    }
  }

  async getActiveChatRooms(page = 1, limit = 20) {
    try {
      const response = await apiClient.get(
        `${API_ENDPOINTS.GET_ACTIVE_CHAT_ROOMS}?page=${page}&limit=${limit}`
      );
      return response;
    } catch (error) {
      console.error("Error getting active chat rooms:", error);
      throw error;
    }
  }

  // Cleanup
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.currentRoom = null;
    }

    // Clear all callbacks
    this.connectionCallbacks = [];
    this.messageCallbacks = [];
    this.userEventCallbacks = [];
    // this.typingCallbacks = [];
    this.reactionCallbacks = [];
    this.messageEditCallbacks = [];
    this.messageDeleteCallbacks = [];
    this.errorCallbacks = [];
  }

  // Utility methods
  isConnectedToServer() {
    return this.isConnected;
  }

  getCurrentRoom() {
    return this.currentRoom;
  }
}

// Export singleton instance
const chatService = new ChatService();
export default chatService;
