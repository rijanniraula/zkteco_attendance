const say = require("say");
const db = require("../db");
const { withDevice, startRealTime } = require("./device");
const { getSetting } = require("./settings");
const { isLatePunch } = require("./attendance");
const { toLocalDateTime } = require("../helpers/dates");

const syncState = {
  running: false,
  lastSyncAt: null,
  lastInserted: 0,
  lastError: null,
};

const insertLog = db.prepare(
  `INSERT OR IGNORE INTO attendance_logs (device_user_id, record_time, type, state, source)
   VALUES (@device_user_id, @record_time, @type, @state, @source)`
);

const upsertDeviceUser = db.prepare(
  `INSERT INTO device_users (device_user_id, uid, name, card_no, role, synced_at)
   VALUES (@device_user_id, @uid, @name, @card_no, @role, datetime('now', 'localtime'))
   ON CONFLICT(device_user_id) DO UPDATE SET
     uid = excluded.uid, name = excluded.name, card_no = excluded.card_no,
     role = excluded.role, synced_at = excluded.synced_at`
);

// Pull all logs and users from the device into SQLite. Duplicates are ignored.
const syncAll = async () => {
  if (syncState.running) return { skipped: true, ...syncState };
  syncState.running = true;
  try {
    const { logs, users } = await withDevice(async (device) => ({
      logs: (await device.getAttendances())?.data || [],
      users: (await device.getUsers())?.data || [],
    }));

    const inserted = db.transaction(() => {
      let count = 0;
      for (const log of logs) {
        const time = new Date(log.record_time);
        if (Number.isNaN(time.getTime())) continue;
        count += insertLog.run({
          device_user_id: String(log.user_id),
          record_time: toLocalDateTime(time),
          type: log.type ?? null,
          state: log.state ?? null,
          source: "sync",
        }).changes;
      }
      for (const u of users) {
        upsertDeviceUser.run({
          device_user_id: String(u.userId),
          uid: u.uid ?? null,
          name: u.name || null,
          card_no: u.cardno ? String(u.cardno) : null,
          role: u.role ?? null,
        });
      }
      return count;
    })();

    Object.assign(syncState, {
      lastSyncAt: new Date().toISOString(),
      lastInserted: inserted,
      lastError: null,
    });
    console.log(`Sync done: ${logs.length} logs read, ${inserted} new, ${users.length} device users`);
    return { ...syncState };
  } catch (error) {
    syncState.lastError = error.message;
    console.error("Sync failed:", error.message);
    throw error;
  } finally {
    syncState.running = false;
  }
};

const findUserGroup = db.prepare(
  `SELECT g.* FROM users u JOIN shift_groups g ON g.id = u.shift_group_id
   WHERE u.device_user_id = ? AND u.is_active = 1`
);

// Save a live punch and announce whether it was on time
const handleRealTimeLog = ({ userId, attTime }) => {
  const time = new Date(attTime);
  if (!userId || Number.isNaN(time.getTime())) return;
  const recordTime = toLocalDateTime(time);
  insertLog.run({
    device_user_id: String(userId),
    record_time: recordTime,
    type: null,
    state: null,
    source: "realtime",
  });

  const weekday = time.getDay();
  const isOff = (getSetting("weekly_off_days") || []).includes(weekday) ||
    db.prepare("SELECT 1 FROM holidays WHERE date = ?").get(recordTime.slice(0, 10));
  const group = findUserGroup.get(String(userId));
  const late = !isOff && isLatePunch(group, weekday, recordTime.slice(11));
  console.log("Real-time log", { userId, recordTime, late });
  say.speak(late ? "Sorry Attendance not recorded" : "Thank You");
};

let syncTimer = null;

const scheduleSync = () => {
  clearTimeout(syncTimer);
  const minutes = Math.max(1, Number(getSetting("sync_interval_min")) || 5);
  syncTimer = setTimeout(async () => {
    await syncAll().catch(() => {});
    scheduleSync();
  }, minutes * 60 * 1000);
};

// Initial sync, periodic sync and the live listener
const startSync = async () => {
  await syncAll().catch(() => {});
  scheduleSync();
  startRealTime(handleRealTimeLog);
};

const getSyncState = () => ({ ...syncState });

module.exports = { syncAll, startSync, scheduleSync, getSyncState };
