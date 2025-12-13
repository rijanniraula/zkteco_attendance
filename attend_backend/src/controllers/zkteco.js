const { checkAttendanceTime, connectDevice } = require("../helpers/global.js");
const say = require("say");
require("dotenv").config();

async function getRealTimeLogs() {
  const device = await connectDevice();
  try {
    // Listen for real-time logs
    await device.getRealTimeLogs((realTimeLog) => {
      console.log("realTimeLog", realTimeLog);

      // Check attendance time
      const result = checkAttendanceTime(
        realTimeLog.attTime,
        realTimeLog.userId
      );

      if (result.isLate) {
        say.speak("Sorry Attendance not recorded");
      } else {
        say.speak("Thank You");
      }
    });
  } catch (error) {
    console.error("Error:", error);
  }
}

async function getAttendanceLogs(req, res) {
  const device = await connectDevice();
  try {
    const attendanceLogs = await device.getAttendances();
    res
      .status(200)
      .json({
        success: true,
        ...attendanceLogs,
        totalLogs: attendanceLogs.data.length,
      });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = {
  getRealTimeLogs,
  getAttendanceLogs,
};
