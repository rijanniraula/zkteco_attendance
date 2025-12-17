const {
  getRealTimeLogs,
  getAttendanceLogs,
  exportAttendanceLogs,
} = require("../controllers/zkteco");
const express = require("express");
const router = express.Router();

// get real time logs
router.get("/get-real-time-logs", getRealTimeLogs);

// get attendance logs
router.post("/get-attendance", getAttendanceLogs);

// export attendance logs
router.post("/export", exportAttendanceLogs);

module.exports = router;
