const db = require("../../db");
const HttpError = require("../../helpers/httpError");
const { audit } = require("../../services/audit");
const { getAllSettings, setSetting } = require("../../services/settings");
const { scheduleSync } = require("../../services/sync");

const getSettings = (req, res) => {
  res.json({ success: true, data: getAllSettings() });
};

const updateSettings = (req, res) => {
  const before = getAllSettings();
  for (const [key, value] of Object.entries(req.body)) {
    setSetting(key, value);
  }
  const after = getAllSettings();
  audit({ actorId: req.user.id, action: "update", entity: "settings", before, after });
  if ("sync_interval_min" in req.body) scheduleSync();
  res.json({ success: true, data: after });
};

const parseGroup = (g) => g && { ...g, weekday_overrides: JSON.parse(g.weekday_overrides), is_flexible: Boolean(g.is_flexible) };
const getGroup = (id) => parseGroup(db.prepare("SELECT * FROM shift_groups WHERE id = ?").get(id));

const listShiftGroups = (req, res) => {
  const rows = db
    .prepare(
      `SELECT g.*, (SELECT COUNT(*) FROM users u WHERE u.shift_group_id = g.id) AS user_count
       FROM shift_groups g ORDER BY g.name`
    )
    .all()
    .map(parseGroup);
  res.json({ success: true, data: rows });
};

const saveGroup = (id, body) => {
  const values = [
    body.name,
    body.start_time,
    body.end_time,
    JSON.stringify(body.weekday_overrides || {}),
    body.is_flexible ? 1 : 0,
  ];
  try {
    if (id) {
      db.prepare(
        `UPDATE shift_groups SET name = ?, start_time = ?, end_time = ?, weekday_overrides = ?,
         is_flexible = ?, updated_at = datetime('now', 'localtime') WHERE id = ?`
      ).run(...values, id);
      return id;
    }
    return db
      .prepare(
        `INSERT INTO shift_groups (name, start_time, end_time, weekday_overrides, is_flexible)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(...values).lastInsertRowid;
  } catch (error) {
    if (String(error.code).startsWith("SQLITE_CONSTRAINT")) {
      throw new HttpError(409, "A shift group with this name already exists");
    }
    throw error;
  }
};

const createShiftGroup = (req, res) => {
  const group = getGroup(saveGroup(null, req.body));
  audit({ actorId: req.user.id, action: "create", entity: "shift_group", entityId: group.id, after: group });
  res.status(201).json({ success: true, data: group });
};

const updateShiftGroup = (req, res) => {
  const id = Number(req.params.id);
  const before = getGroup(id);
  if (!before) throw new HttpError(404, "Shift group not found");
  saveGroup(id, req.body);
  const after = getGroup(id);
  audit({ actorId: req.user.id, action: "update", entity: "shift_group", entityId: id, before, after });
  res.json({ success: true, data: after });
};

const deleteShiftGroup = (req, res) => {
  const id = Number(req.params.id);
  const before = getGroup(id);
  if (!before) throw new HttpError(404, "Shift group not found");
  db.prepare("DELETE FROM shift_groups WHERE id = ?").run(id);
  audit({ actorId: req.user.id, action: "delete", entity: "shift_group", entityId: id, before });
  res.json({ success: true });
};

module.exports = {
  getSettings,
  updateSettings,
  listShiftGroups,
  createShiftGroup,
  updateShiftGroup,
  deleteShiftGroup,
};
