require("dotenv").config();
const express = require("express");
const cors = require("cors");
// const connectDB = require("./config/db");
const { getRealTimeLogs } = require("./controllers/zkteco");

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
// connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes (including your /api/users/sync route)
// ...

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

//get real time logs for late/early attendance sound
getRealTimeLogs().catch((err) => {
  console.error("Error:", err);
});

//start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
