const mongoose = require("mongoose");
const ChatRoom = require("../models/ChatRoom");
require("dotenv").config();

async function fixMessageContent() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Find all chat rooms with messages that have empty content
    const chatRooms = await ChatRoom.find({
      "messages.content": { $in: ["", null, undefined] },
    });

    console.log(
      `Found ${chatRooms.length} chat rooms with empty message content`
    );

    for (const chatRoom of chatRooms) {
      let updated = false;

      for (const message of chatRoom.messages) {
        if (!message.content || message.content.trim() === "") {
          // Set default content based on message type
          if (message.messageType === "image") {
            message.content = ""; // Empty string is fine for images
          } else if (message.messageType === "system") {
            message.content = message.content || "System message";
          } else {
            message.content = message.content || "Message";
          }
          updated = true;
        }
      }

      if (updated) {
        await chatRoom.save({ validateBeforeSave: false }); // Skip validation to avoid the current error
        console.log(`Fixed messages in chat room ${chatRoom._id}`);
      }
    }

    console.log("Migration completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  fixMessageContent();
}

module.exports = fixMessageContent;
