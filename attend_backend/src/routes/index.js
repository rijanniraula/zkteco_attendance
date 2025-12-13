const express = require("express");
const router = express.Router();
const zktecoRoutes = require("./zktecoRoutes");

router.use("/zkteco", zktecoRoutes);

module.exports = router;
