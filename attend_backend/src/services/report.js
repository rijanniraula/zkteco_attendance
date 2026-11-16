const ExcelJS = require("exceljs");

// The export treats late days as absent: the cell shows "A" and the day counts
// toward Absent. The Late column says how many of those absences were late arrivals.
const exportCode = (cell) => (cell.status === "late" ? "A" : cell.code);

const TOTAL_COLUMNS = [
  ["Present", (t) => t.present],
  ["Absent", (t) => t.absent + t.late],
  ["Late", (t) => t.late],
  ["Leave", (t) => t.leave],
  ["Holiday", (t) => t.holiday],
];

/**
 * Generate an Excel buffer from buildReport() output
 * @param {Object} report - { start, end, days, rows }
 * @param {Boolean} [showPunchTimes] - append punch times to each cell
 * @returns {Promise<Buffer>}
 */
const generateExcelReport = async (report, showPunchTimes = false) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Attendance Report");

  const cell = worksheet.getCell("A1");
  cell.value = `Attendance Report ${report.start} to ${report.end}`;
  cell.alignment = { vertical: "middle", horizontal: "center" };
  cell.font = { bold: true, size: 14 };

  const header = worksheet.addRow([
    "SN",
    "UID",
    "Name",
    ...report.days.map((d) => Number(d.date.slice(8))),
    ...TOTAL_COLUMNS.map(([label]) => label),
  ]);
  header.font = { bold: true };

  report.rows.forEach((row, index) => {
    worksheet.addRow([
      index + 1,
      row.deviceUserId ?? "",
      row.name,
      ...report.days.map(({ date }) => {
        const c = row.cells[date];
        const code = `${exportCode(c)}${c.edited ? "*" : ""}`;
        return showPunchTimes && c.times.length
          ? `${code} (${c.times.join(", ")})`
          : code;
      }),
      ...TOTAL_COLUMNS.map(([, total]) => total(row.totals)),
    ]);
  });

  worksheet.addRow([]);
  worksheet.addRow([
    "P = Present, A = Absent (includes late arrivals), LV = Leave, H = Holiday, - = Pending, * = edited by admin",
  ]);

  return workbook.xlsx.writeBuffer();
};

module.exports = { generateExcelReport };
