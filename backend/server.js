const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/dbconnect");
const { createTransporter, testEmailConnection } = require("./config/email");
const SocketService = require("./services/socketService");
const ScheduledJobs = require("./jobs/scheduledJobs");

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

// IMPORTANT: Webhook route MUST come BEFORE express.json() middleware
// Stripe webhooks require raw body
app.use("/webhooks", require("./routes/webhookRoutes"));

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
app.use("/engagement", require("./routes/engagementRoutes"));
app.use("/feed", require("./routes/feedRoutes"));
app.use("/user", require("./routes/userRoutes"));
app.use("/stripe", require("./routes/stripeRoutes"));

// Health check route
app.get("/", (req, res) => {
  res.json({ message: "newsnatter API is running!", status: "healthy" });
});

const startServer = async () => {
  try {
    await connectDB();
    await testEmailConnection(createTransporter());

    // Initialize scheduled jobs
    ScheduledJobs.initJobs();

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
