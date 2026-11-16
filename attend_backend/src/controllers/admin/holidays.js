const db = require("../../db");
const HttpError = require("../../helpers/httpError");
const { audit } = require("../../services/audit");
const { eachDateKey } = require("../../helpers/dates");

const MAX_RANGE_DAYS = 60;

const listHolidays = (req, res) => {
  const { year } = req.validatedQuery;
  const rows = year
    ? db.prepare("SELECT * FROM holidays WHERE date LIKE ? ORDER BY date").all(`${year}-%`)
    : db.prepare("SELECT * FROM holidays ORDER BY date").all();
  res.json({ success: true, data: rows });
};

// Add one holiday, or one per day from date to endDate. Dates already marked are skipped.
const createHoliday = (req, res) => {
  const { date, endDate, name } = req.body;
  const dates = eachDateKey(date, endDate || date);
  if (dates.length > MAX_RANGE_DAYS) {
    throw new HttpError(400, `A holiday range can be at most ${MAX_RANGE_DAYS} days`);
  }

  const exists = db.prepare("SELECT 1 FROM holidays WHERE date = ?");
  const insert = db.prepare("INSERT INTO holidays (date, name, created_by) VALUES (?, ?, ?)");
  const newDates = dates.filter((d) => !exists.get(d));
  if (newDates.length === 0) {
    throw new HttpError(409, dates.length === 1
      ? "This date is already a holiday"
      : "Every date in this range is already a holiday");
  }

  const created = db.transaction(() =>
    newDates.map((d) => {
      const { lastInsertRowid } = insert.run(d, name, req.user.id);
      const holiday = db.prepare("SELECT * FROM holidays WHERE id = ?").get(lastInsertRowid);
      audit({ actorId: req.user.id, action: "create", entity: "holiday", entityId: holiday.id, after: holiday });
      return holiday;
    })
  )();

  res.status(201).json({
    success: true,
    data: created,
    skipped: dates.filter((d) => !newDates.includes(d)),
  });
};

const deleteHoliday = (req, res) => {
  const id = Number(req.params.id);
  const before = db.prepare("SELECT * FROM holidays WHERE id = ?").get(id);
  if (!before) throw new HttpError(404, "Holiday not found");
  db.prepare("DELETE FROM holidays WHERE id = ?").run(id);
  audit({ actorId: req.user.id, action: "delete", entity: "holiday", entityId: id, before });
  res.json({ success: true });
};

// Remove several holidays at once (a multi-day range shown as one row)
const deleteHolidays = (req, res) => {
  const { ids } = req.body;
  const select = db.prepare("SELECT * FROM holidays WHERE id = ?");
  const remove = db.prepare("DELETE FROM holidays WHERE id = ?");
  const deleted = db.transaction(() =>
    ids.map((id) => {
      const before = select.get(id);
      if (!before) return null;
      remove.run(id);
      audit({ actorId: req.user.id, action: "delete", entity: "holiday", entityId: id, before });
      return id;
    }).filter(Boolean)
  )();
  res.json({ success: true, deleted });
};

module.exports = { listHolidays, createHoliday, deleteHoliday, deleteHolidays };
