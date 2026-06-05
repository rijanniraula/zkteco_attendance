const { dummyAttendanceLogs } = require("../config/dummyData.js");
const { checkAttendanceTime, connectDevice } = require("../helpers/global.js");
const say = require("say");
require("dotenv").config();
const {
  generateAttendanceReportData,
  generateExcelReport,
} = require("../helpers/AttendanceReportGenerator");

const parseDateLocal = (dateStr, isEnd = false) => {
  if (!dateStr) return new Date();
  
  const yyyymmddRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (yyyymmddRegex.test(dateStr)) {
    const [year, month, day] = dateStr.split("-").map(Number);
    return isEnd
      ? new Date(year, month - 1, day, 23, 59, 59, 999)
      : new Date(year, month - 1, day, 0, 0, 0, 0);
  }

  const d = new Date(dateStr);
  if (isEnd) {
    d.setHours(23, 59, 59, 999);
  } else {
    d.setHours(0, 0, 0, 0);
  }
  return d;
};

async function getRealTimeLogs() {
  try {
    const device = await connectDevice();
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

async function getDeviceInfo(req, res) {
  try {
    const device = await connectDevice();
    const deviceInfo = await device.getInfo();
    const deviceName = await device.getDeviceName();
    res.status(200).json({
      success: true,
      data: { ...deviceInfo, deviceName },
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

async function getAttendanceLogs(req, res) {
  const { startDate, endDate, userId, showPunchTimes } = req.body;
  try {
    const device = await connectDevice();
    const attendanceLogs = await device.getAttendances();
    const start = parseDateLocal(startDate, false);
    const end = parseDateLocal(endDate, true);
    const filteredLogs = attendanceLogs.data.filter((log) => {
      const logDate = new Date(log.record_time);
      const isWithinDate = logDate >= start && logDate <= end;
      const matchesUser = userId && userId !== "all" ? String(log.user_id) === String(userId) : true;
      return isWithinDate && matchesUser;
    });
    // Generate report data
    const reportData = generateAttendanceReportData(
      filteredLogs,
      startDate,
      endDate,
      userId && userId !== "all" ? userId : null,
      showPunchTimes === true || showPunchTimes === "true"
    );

    return res.status(200).json({
      success: true,
      data: filteredLogs,
      report: reportData,
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
  const { startDate, endDate, userId, showPunchTimes } = req.body;
  console.log({ startDate, endDate, userId, showPunchTimes });
  try {
    const device = await connectDevice();
    const attendanceLogs = await device.getAttendances();

    // device not connected
    const start = parseDateLocal(startDate, false);
    const end = parseDateLocal(endDate, true);
    const filteredLogs = attendanceLogs.data.filter((log) => {
      const logDate = new Date(log.record_time);
      const isWithinDate = logDate >= start && logDate <= end;
      const matchesUser = userId && userId !== "all" ? String(log.user_id) === String(userId) : true;
      return isWithinDate && matchesUser;
    });

    try {
      // Generate report data structure
      const reportData = generateAttendanceReportData(
        filteredLogs,
        startDate,
        endDate,
        userId && userId !== "all" ? userId : null,
        showPunchTimes === true || showPunchTimes === "true"
      );

      // Generate Excel buffer from report data
      const buffer = await generateExcelReport(reportData, startDate, endDate);

      // Set headers for file download
      const filename = `Attendance_Report_${startDate}_to_${endDate}.xlsx`;
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );
      res.setHeader("Content-Length", buffer.length);

      // Send the buffer
      res.send(buffer);
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getRealTimeLogs,
  getAttendanceLogs,
  exportAttendanceLogs,
  getDeviceInfo,
};
