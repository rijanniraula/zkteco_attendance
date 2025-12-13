const { getRealTimeLogs, getAttendanceLogs } = require("../controllers/zkteco");
const express = require("express");
const router = express.Router();

// get real time logs
router.get("/get-real-time-logs", getRealTimeLogs);

// get attendance logs
router.get("/get-attendance", getAttendanceLogs);

module.exports = router;
