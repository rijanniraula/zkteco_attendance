const ExcelJS = require("exceljs");
const { users } = require("./usersMap");

const getUserDisplayName = (userId) => {
  const user = users.find((user) => user.userId == userId);
  return user?.displayName || "N/A";
};

/**
 * Generate attendance report data structure
 * @param {Array} filteredLogs - Array of attendance logs
 * @param {String} startDate - Start date (YYYY-MM-DD)
 * @param {String} endDate - End date (YYYY-MM-DD)
 * @param {String} [userId] - Optional user ID to filter by
 * @param {Boolean} [showPunchTimes] - Optional flag to display punch times
 * @returns {Object} - Report data with columns and rows
 */
const generateAttendanceReportData = (filteredLogs, startDate, endDate, userId = null, showPunchTimes = false) => {
  console.log({ filteredLogs, startDate, endDate, userId, showPunchTimes });

  // Build date range with headers as day numbers
  const parseLocalMidnight = (dateStr, isEnd = false) => {
    if (!dateStr) return new Date();
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
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

  const start = parseLocalMidnight(startDate, false);
  const end = parseLocalMidnight(endDate, true);
  const dayColumns = [];
  
  const nextDatePointer = new Date(start);
  while (nextDatePointer <= end) {
    const year = nextDatePointer.getFullYear();
    const month = String(nextDatePointer.getMonth() + 1).padStart(2, '0');
    const day = String(nextDatePointer.getDate()).padStart(2, '0');
    const dayKey = `${year}-${month}-${day}`;
    const isSaturday = nextDatePointer.getDay() === 6; // 6 = Saturday
    dayColumns.push({
      header: `${nextDatePointer.getDate()}`,
      key: `day_${dayKey}`,
      dayKey,
      isSaturday,
    });
    nextDatePointer.setDate(nextDatePointer.getDate() + 1);
  }

  const columns = [
    { header: "SN", key: "sn" },
    { header: "UID", key: "user_id" },
    { header: "Name", key: "name" },
    ...dayColumns.map(({ header, key }) => ({ header, key })),
    { header: "Absent Days", key: "absent_days" },
  ];

  // logs by user and date containing arrays of punch times
  const logsByUser = filteredLogs.reduce((acc, log) => {
    const d = new Date(log.record_time);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dayKey = `${year}-${month}-${day}`;
    
    let hour = d.getHours();
    const minute = String(d.getMinutes()).padStart(2, '0');
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12;
    hour = hour ? hour : 12; // the hour '0' should be '12'
    const formattedHour = String(hour).padStart(2, '0');
    const punchTime = `${formattedHour}:${minute} ${ampm}`;

    const userIdStr = String(log.user_id);
    if (!acc[userIdStr]) acc[userIdStr] = {};
    if (!acc[userIdStr][dayKey]) acc[userIdStr][dayKey] = [];
    acc[userIdStr][dayKey].push(punchTime);
    return acc;
  }, {});

  let uniqueUsers;
  if (userId) {
    uniqueUsers = [String(userId)];
  } else {
    const mappedUserIds = users.map((u) => String(u.userId));
    const logUserIds = filteredLogs.map((log) => String(log.user_id));
    uniqueUsers = [...new Set([...mappedUserIds, ...logUserIds])].sort((a, b) => Number(a) - Number(b));
  }

  const rows = uniqueUsers.map((userId, index) => {
    const row = {
      sn: index + 1,
      user_id: userId,
      name: getUserDisplayName(userId),
    };

    let absentDays = 0;

    dayColumns.forEach(({ key, dayKey, isSaturday }) => {
      const punchTimes = logsByUser[userId]?.[dayKey];
      const hasLog = punchTimes && punchTimes.length > 0;
      if (hasLog) {
        if (showPunchTimes) {
          row[key] = `P (${punchTimes.join(", ")})`;
        } else {
          row[key] = "P";
        }
      } else if (isSaturday) {
        row[key] = "H";
      } else {
        row[key] = "A";
        absentDays += 1;
      }
    });

    row.absent_days = absentDays;
    return row;
  });

  return {
    columns,
    rows,
    dayColumns,
  };
};

/**
 * Generate Excel file buffer from report data
 * @param {Object} reportData - Report data with columns and rows
 * @param {String} startDate - Start date for filename
 * @param {String} endDate - End date for filename
 * @returns {Promise<Buffer>} - Excel file buffer
 */
const generateExcelReport = async (reportData, startDate, endDate) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Attendance Report");

  // Set heading
  const cell = worksheet.getCell("A1");
  cell.value = `Attendance Report ${startDate} to ${endDate}`;
  cell.alignment = { vertical: "middle", horizontal: "center" };
  cell.font = { bold: true, size: 14 };

  worksheet.addRow([
    "SN",
    "UID",
    "Name",
    ...reportData.dayColumns.map((column) => column.header),
    "Absent Days",
  ]);

  // Add rows starting from row 2
  reportData.rows.forEach((row) => {
    worksheet.addRow([
      row.sn,
      row.user_id,
      row.name,
      ...reportData.dayColumns.map((column) => row[column.key]),
      row.absent_days,
    ]);
  });

  return workbook.xlsx.writeBuffer();
};

module.exports = {
  generateAttendanceReportData,
  generateExcelReport,
};
