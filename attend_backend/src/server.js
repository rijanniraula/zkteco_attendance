require("dotenv").config();
const express = require("express");
const cors = require("cors");
const migrate = require("./db/migrate");
const { startSync } = require("./services/sync");
const routes = require("./routes");

const app = express();
const PORT = process.env.PORT || 3000;

// Create / update the SQLite schema
migrate();

// Middleware
const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);
app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : true,
    allowedHeaders: ["Content-Type", "Authorization", "ngrok-skip-browser-warning"],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes
app.use("/api", routes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  const status = err.status || 500;
  if (status >= 500) console.error("Error:", err);
  res.status(status).json({
    success: false,
    message: err.message || "Internal Server Error",
    ...(err.details && { details: err.details }),
    ...(process.env.NODE_ENV === "development" && status >= 500 && { stack: err.stack }),
  });
});

//start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Device sync (initial + periodic) and real-time punch listener
startSync();
