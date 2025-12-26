const ExcelJS = require("exceljs");

/**
 * Generate attendance report data structure
 * @param {Array} filteredLogs - Array of attendance logs
 * @param {String} startDate - Start date (YYYY-MM-DD)
 * @param {String} endDate - End date (YYYY-MM-DD)
 * @returns {Object} - Report data with columns and rows
 */
const generateAttendanceReportData = (filteredLogs, startDate, endDate) => {
  console.log({ filteredLogs, startDate, endDate });

  // Build date range with headers as day numbers
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dayColumns = [];
  for (
    const nextDatePointer = new Date(start);
    nextDatePointer <= end;
    nextDatePointer.setDate(nextDatePointer.getDate() + 1)
  ) {
    const dayKey = nextDatePointer.toISOString().slice(0, 10);
    const isSaturday = nextDatePointer.getDay() === 6; // 6 = Saturday
    dayColumns.push({
      header: `${nextDatePointer.getDate()}`,
      key: `day_${dayKey}`,
      dayKey,
      isSaturday,
    });
  }

  const columns = [
    { header: "SN", key: "sn" },
    { header: "UID", key: "user_id" },
    { header: "Name", key: "name" },
    ...dayColumns.map(({ header, key }) => ({ header, key })),
    { header: "Absent Days", key: "absent_days" },
  ];

  // logs by user and date
  const logsByUser = filteredLogs.reduce((acc, log) => {
    const dayKey = new Date(log.record_time).toISOString().slice(0, 10);
    if (!acc[log.user_id]) acc[log.user_id] = new Set();
    acc[log.user_id].add(dayKey);
    return acc;
  }, {});

  const uniqueUsers = [...new Set(filteredLogs.map((log) => log.user_id))];

  const rows = uniqueUsers.map((userId, index) => {
    const row = {
      sn: index + 1,
      user_id: userId,
      name: "",
    };

    let absentDays = 0;

    dayColumns.forEach(({ key, dayKey, isSaturday }) => {
      const hasLog = logsByUser[userId]?.has(dayKey);
      if (hasLog) {
        row[key] = "P";
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
