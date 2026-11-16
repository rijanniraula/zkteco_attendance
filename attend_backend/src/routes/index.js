const express = require("express");
const router = express.Router();
const authRoutes = require("./auth");
const meRoutes = require("./me");
const adminRoutes = require("./admin");

router.use("/auth", authRoutes);
router.use("/me", meRoutes);
router.use("/admin", adminRoutes);

module.exports = router;
