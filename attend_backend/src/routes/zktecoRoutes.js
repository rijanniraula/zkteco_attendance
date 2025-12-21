const {
  getRealTimeLogs,
  getAttendanceLogs,
  exportAttendanceLogs,
  getDeviceInfo,
} = require("../controllers/zkteco");
const express = require("express");
const router = express.Router();

// get device info
router.get("/get-device-info", getDeviceInfo);

// get real time logs
router.get("/get-real-time-logs", getRealTimeLogs);

// get attendance logs
router.post("/get-attendance", getAttendanceLogs);

// export attendance logs
router.post("/export", exportAttendanceLogs);

module.exports = router;
