const { buildReport } = require("../services/attendance");

// Attendance history for the logged-in user only
const getMyAttendance = (req, res) => {
  const { start, end } = req.validatedQuery;
  const report = buildReport({ start, end, userId: req.user.id });
  res.json({
    success: true,
    start,
    end,
    days: report.days,
    row: report.rows[0] || null,
    deviceMapped: Boolean(req.user.device_user_id),
  });
};

module.exports = { getMyAttendance };
