const { dummyAttendanceLogs } = require("../config/dummyData.js");
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
  const { startDate, endDate } = req.body;
  const filteredLogs = dummyAttendanceLogs.data.filter((log) => {
    const logDate = new Date(log.record_time);
    return logDate >= new Date(startDate) && logDate <= new Date(endDate);
  });
  console.log(filteredLogs);
  return res.status(200).json({
    success: true,
    data: filteredLogs,
    startDate: req.body.startDate,
    endDate: req.body.endDate,
    totalLogs: filteredLogs.length,
  });
  const device = await connectDevice();
  try {
    const attendanceLogs = await device.getAttendances();
    const filteredLogs = attendanceLogs.data.filter((log) => {
      const logDate = new Date(log.record_time);
      return logDate >= new Date(startDate) && logDate <= new Date(endDate);
    });
    res.status(200).json({
      success: true,
      data: filteredLogs,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      totalLogs: filteredLogs.length,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

const exportAttendanceLogs = async (req, res) => {
  const { startDate, endDate } = req.body;
  const device = await connectDevice();
  try {
    const attendanceLogs = await device.getAttendances();
    const filteredLogs = attendanceLogs.data.filter((log) => {
      const logDate = new Date(log.record_time);
      return logDate >= new Date(startDate) && logDate <= new Date(endDate);
    });
    console.log(filteredLogs);
    // TODO: export the logs to an excel file
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getRealTimeLogs,
  getAttendanceLogs,
  exportAttendanceLogs,
};
