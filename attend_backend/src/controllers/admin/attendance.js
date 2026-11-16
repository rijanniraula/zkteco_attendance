const db = require("../../db");
const HttpError = require("../../helpers/httpError");
const { buildReport } = require("../../services/attendance");
const { generateExcelReport } = require("../../services/report");
const { audit } = require("../../services/audit");

const getReport = (req, res) => {
  const { start, end, userId } = req.validatedQuery;
  const report = buildReport({ start, end, userId, linkedOnly: true });
  res.json({ success: true, ...report });
};

const exportReport = async (req, res) => {
  const { start, end, userId, showPunchTimes } = req.body;
  const report = buildReport({ start, end, userId, linkedOnly: true });
  const buffer = await generateExcelReport(report, showPunchTimes);
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="Attendance_Report_${start}_to_${end}.xlsx"`
  );
  res.setHeader("Content-Length", buffer.length);
  res.send(Buffer.from(buffer));
};

const getOverride = (userId, date) =>
  db.prepare("SELECT * FROM attendance_overrides WHERE user_id = ? AND date = ?").get(userId, date);

// Create or replace the admin override for one user/day
const upsertOverride = (req, res) => {
  const { userId, date, status, check_in, check_out, reason } = req.body;
  if (!db.prepare("SELECT 1 FROM users WHERE id = ?").get(userId)) {
    throw new HttpError(404, "User not found");
  }
  const before = getOverride(userId, date);
  db.prepare(
    `INSERT INTO attendance_overrides (user_id, date, status, check_in, check_out, reason, updated_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id, date) DO UPDATE SET
       status = excluded.status, check_in = excluded.check_in, check_out = excluded.check_out,
       reason = excluded.reason, updated_by = excluded.updated_by,
       updated_at = datetime('now', 'localtime')`
  ).run(userId, date, status, check_in || null, check_out || null, reason, req.user.id);
  const after = getOverride(userId, date);
  audit({
    actorId: req.user.id,
    action: before ? "update" : "create",
    entity: "attendance_override",
    entityId: after.id,
    before,
    after,
  });
  res.json({ success: true, data: after });
};

const deleteOverride = (req, res) => {
  const id = Number(req.params.id);
  const before = db.prepare("SELECT * FROM attendance_overrides WHERE id = ?").get(id);
  if (!before) throw new HttpError(404, "Override not found");
  db.prepare("DELETE FROM attendance_overrides WHERE id = ?").run(id);
  audit({ actorId: req.user.id, action: "delete", entity: "attendance_override", entityId: id, before });
  res.json({ success: true });
};

module.exports = { getReport, exportReport, upsertOverride, deleteOverride };
