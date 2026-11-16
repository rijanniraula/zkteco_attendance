const db = require("../db");

const DEFAULTS = {
  weekly_off_days: [0, 6],
  sync_interval_min: 5,
  zk_ip: "",
};

const getSetting = (key) => {
  const row = db.prepare("SELECT value FROM settings WHERE key = ?").get(key);
  return row ? JSON.parse(row.value) : DEFAULTS[key];
};

const setSetting = (key, value) => {
  db.prepare(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`
  ).run(key, JSON.stringify(value));
};

const getAllSettings = () =>
  Object.fromEntries(Object.keys(DEFAULTS).map((k) => [k, getSetting(k)]));

module.exports = { getSetting, setSetting, getAllSettings };
