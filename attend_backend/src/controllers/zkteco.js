const { dummyAttendanceLogs } = require("../config/dummyData.js");
const { checkAttendanceTime, connectDevice } = require("../helpers/global.js");
const say = require("say");
require("dotenv").config();
const {
  generateAttendanceReportData,
  generateExcelReport,
} = require("../helpers/AttendanceReportGenerator");

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
  const { startDate, endDate } = req.body;
  try {
    const device = await connectDevice();
    const attendanceLogs = await device.getAttendances();
    const filteredLogs = attendanceLogs.data.filter((log) => {
      const logDate = new Date(log.record_time);
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); //  end of day
      return logDate >= start && logDate <= end;
    });
    // Generate report data
    const reportData = generateAttendanceReportData(
      filteredLogs,
      startDate,
      endDate
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
  const { startDate, endDate } = req.body;
  console.log({ startDate, endDate });
  try {
    const device = await connectDevice();
    const attendanceLogs = await device.getAttendances();

    // device not connected
    const filteredLogs = attendanceLogs.data.filter((log) => {
      const logDate = new Date(log.record_time);
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Set to end of day
      return logDate >= start && logDate <= end;
    });

    try {
      // Generate report data structure
      const reportData = generateAttendanceReportData(
        filteredLogs,
        startDate,
        endDate
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
