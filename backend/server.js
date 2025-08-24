require("dotenv").config(); // must be at very top!
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const visitorRoutes = require("./routes/visitorRoutes");
const { sendMail } = require("./utils/mailer"); // ✅ Import mail utility

const app = express();

// ✅ Connect to MongoDB
connectDB();

// ✅ Middleware
app.use(
  cors({
    origin: process.env.APP_BASE_URL || "http://localhost:3000", // frontend base URL
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ✅ Body parser (built into Express)
app.use(express.json({ limit: "10mb" }));

// ✅ API Routes
app.use("/api/visitors", visitorRoutes);

// ✅ Health check route
app.get("/", (req, res) => {
  res.send("🚀 Visitor Management API is running");
});

// ✅ Test Mail Route
app.get("/api/test-mail", async (req, res) => {
  try {
    await sendMail(
      "your-second-email@gmail.com", // change to another email you control
      "Visitor Management Test 🚀",
      "<h2>This is a test email</h2><p>If you see this, SMTP is working ✅</p>"
    );
    res.json({ success: true, message: "Test email sent!" });
  } catch (err) {
    console.error("❌ Mail error:", err.message);
    res.status(500).json({ success: false, error: "Mail failed" });
  }
});

// ✅ Create server with socket.io
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.APP_BASE_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

// ✅ Make io available in routes/controllers
app.set("io", io);

// ✅ Listen for socket connections
io.on("connection", (socket) => {
  console.log("🔌 New client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("❌ Client disconnected:", socket.id);
  });
});

// ✅ Example (optional): Notify admin email on server start
(async () => {
  if (process.env.ADMIN_EMAIL) {
    try {
      await sendMail(
        process.env.ADMIN_EMAIL,
        "🚀 Visitor System Started",
        "<p>Your visitor management backend is now running successfully.</p>"
      );
      console.log("📩 Startup email sent to admin");
    } catch (err) {
      console.error("⚠️ Could not send startup email:", err.message);
    }
  }
})();

// ✅ Global error handler (safety net)
app.use((err, req, res, next) => {
  console.error("🔥 Global error handler:", err.stack);
  res.status(500).json({ success: false, error: "Server error" });
});

// ✅ Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(`✅ Server with Socket.IO running at http://localhost:${PORT}`)
);
