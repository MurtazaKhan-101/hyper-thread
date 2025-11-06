/**
 * Frontend Chat Integration Example
 *
 * This is an example of how to integrate the chat system in your frontend
 * Install socket.io-client: npm install socket.io-client
 */

import io from "socket.io-client";

class ChatService {
  constructor() {
    this.socket = null;
    this.currentRoom = null;
    this.token = null;
    this.isConnected = false;
  }

  // Initialize socket connection
  connect(token) {
    this.token = token;

    this.socket = io(
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3003",
      {
        auth: {
          token: token,
        },
        transports: ["websocket", "polling"],
      }
    );

    this.setupEventListeners();
  }

  // Setup socket event listeners
  setupEventListeners() {
    this.socket.on("connect", () => {
      console.log("✅ Connected to chat server");
      this.isConnected = true;
    });

    this.socket.on("disconnect", () => {
      console.log("❌ Disconnected from chat server");
      this.isConnected = false;
    });

    this.socket.on("error", (error) => {
      console.error("Socket error:", error);
    });

    // Chat room events
    this.socket.on("joinedRoom", (data) => {
      console.log("Joined room:", data);
      this.onRoomJoined?.(data);
    });

    this.socket.on("leftRoom", (data) => {
      console.log("Left room:", data);
      this.onRoomLeft?.(data);
    });

    // Message events
    this.socket.on("newMessage", (data) => {
      console.log("New message:", data);
      this.onNewMessage?.(data);
    });

    // User events
    this.socket.on("userJoined", (data) => {
      console.log("User joined:", data);
      this.onUserJoined?.(data);
    });

    this.socket.on("userLeft", (data) => {
      console.log("User left:", data);
      this.onUserLeft?.(data);
    });

    // Typing events
    this.socket.on("userTyping", (data) => {
      this.onUserTyping?.(data);
    });

    // Reaction events
    this.socket.on("reactionUpdate", (data) => {
      this.onReactionUpdate?.(data);
    });
  }

  // Join a chat room
  joinRoom(postId) {
    if (!this.isConnected) {
      console.error("Not connected to chat server");
      return;
    }

    this.currentRoom = postId;
    this.socket.emit("joinRoom", { postId });
  }

  // Leave current room
  leaveRoom() {
    if (!this.isConnected || !this.currentRoom) {
      return;
    }

    this.socket.emit("leaveRoom", { postId: this.currentRoom });
    this.currentRoom = null;
  }

  // Send a text message
  sendMessage(content) {
    if (!this.isConnected || !this.currentRoom) {
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
    if (!this.isConnected || !this.currentRoom) {
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
  startTyping() {
    if (!this.isConnected || !this.currentRoom) return;

    this.socket.emit("typingStart", { postId: this.currentRoom });
  }

  // Stop typing indicator
  stopTyping() {
    if (!this.isConnected || !this.currentRoom) return;

    this.socket.emit("typingStop", { postId: this.currentRoom });
  }

  // Add reaction to message
  addReaction(messageId, emoji) {
    if (!this.isConnected || !this.currentRoom) return;

    this.socket.emit("addReaction", {
      postId: this.currentRoom,
      messageId,
      emoji,
    });
  }

  // Upload image for chat
  async uploadImage(file) {
    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/chat/${this.currentRoom}/upload-image`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
          body: formData,
        }
      );

      const result = await response.json();

      if (result.success) {
        return result.data.imageUrl;
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  }

  // REST API methods
  async getChatRoom(postId) {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/chat/${postId}`,
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        }
      );

      return await response.json();
    } catch (error) {
      console.error("Error getting chat room:", error);
      throw error;
    }
  }

  async getChatHistory(postId, page = 1, limit = 50) {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/chat/${postId}/messages?page=${page}&limit=${limit}`,
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        }
      );

      return await response.json();
    } catch (error) {
      console.error("Error getting chat history:", error);
      throw error;
    }
  }

  async getParticipants(postId) {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/chat/${postId}/participants`,
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        }
      );

      return await response.json();
    } catch (error) {
      console.error("Error getting participants:", error);
      throw error;
    }
  }

  // Event callbacks (to be set by the consuming component)
  onRoomJoined = null;
  onRoomLeft = null;
  onNewMessage = null;
  onUserJoined = null;
  onUserLeft = null;
  onUserTyping = null;
  onReactionUpdate = null;

  // Cleanup
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.currentRoom = null;
    }
  }
}

export default ChatService;

/**
 * Usage Example in React Component:
 *
 * import { useEffect, useState } from 'react';
 * import ChatService from './ChatService';
 *
 * const ChatComponent = ({ postId, userToken }) => {
 *   const [chatService] = useState(new ChatService());
 *   const [messages, setMessages] = useState([]);
 *   const [participants, setParticipants] = useState([]);
 *   const [messageInput, setMessageInput] = useState('');
 *
 *   useEffect(() => {
 *     // Initialize chat service
 *     chatService.connect(userToken);
 *
 *     // Set up event handlers
 *     chatService.onNewMessage = (data) => {
 *       setMessages(prev => [...prev, data.message]);
 *     };
 *
 *     chatService.onUserJoined = (data) => {
 *       setParticipants(prev => [...prev, data.user]);
 *     };
 *
 *     chatService.onUserLeft = (data) => {
 *       setParticipants(prev => prev.filter(p => p._id !== data.userId));
 *     };
 *
 *     // Join the room
 *     chatService.joinRoom(postId);
 *
 *     return () => {
 *       chatService.leaveRoom();
 *       chatService.disconnect();
 *     };
 *   }, [postId, userToken]);
 *
 *   const sendMessage = () => {
 *     if (messageInput.trim()) {
 *       chatService.sendMessage(messageInput);
 *       setMessageInput('');
 *     }
 *   };
 *
 *   return (
 *     <div className="chat-container">
 *       <div className="messages">
 *         {messages.map(message => (
 *           <div key={message._id} className="message">
 *             <img src={message.user.profileImage} alt="Profile" />
 *             <div>
 *               <strong>{message.user.username}</strong>
 *               <p>{message.content}</p>
 *               <small>{new Date(message.timestamp).toLocaleTimeString()}</small>
 *             </div>
 *           </div>
 *         ))}
 *       </div>
 *
 *       <div className="input-area">
 *         <input
 *           value={messageInput}
 *           onChange={(e) => setMessageInput(e.target.value)}
 *           onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
 *           placeholder="Type a message..."
 *         />
 *         <button onClick={sendMessage}>Send</button>
 *       </div>
 *     </div>
 *   );
 * };
 */
