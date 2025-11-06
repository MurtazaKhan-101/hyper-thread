const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/dbconnect");
const { createTransporter, testEmailConnection } = require("./config/email");
const SocketService = require("./services/socketService");

dotenv.config();
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT;

// Initialize Socket.IO with CORS configuration
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST"],
  },
  transports: ["websocket", "polling"],
});

// Initialize Socket Service
const socketService = new SocketService(io);

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/auth", require("./routes/authRoutes"));
app.use("/auth", require("./routes/googleAuthRoutes"));
app.use("/onboarding", require("./routes/onboardingRoutes"));
app.use("/posts", require("./routes/postRoutes"));
app.use("/posts", require("./routes/commentRoutes"));
app.use("/chat", require("./routes/chatRoomRoutes"));

// Health check route
app.get("/", (req, res) => {
  res.json({ message: "News Natter API is running!", status: "healthy" });
});

const startServer = async () => {
  try {
    await connectDB();
    await testEmailConnection(createTransporter());
    server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`💬 Socket.IO server ready for connections`);
      console.log(
        `👥 Connected users: ${socketService.getConnectedUsersCount()}`
      );
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
