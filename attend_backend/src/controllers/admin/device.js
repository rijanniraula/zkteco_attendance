const db = require("../../db");
const { withDevice, getStatus } = require("../../services/device");
const { syncAll, getSyncState } = require("../../services/sync");

// Live device info plus connection and sync state. Responds even when the device is down.
const getDeviceInfo = async (req, res) => {
  let info = null;
  try {
    info = await withDevice(async (device) => ({
      ...(await device.getInfo()),
      deviceName: await device.getDeviceName(),
    }));
  } catch {
    // status below carries the error
  }
  const stored = db
    .prepare("SELECT COUNT(*) AS logCount, MAX(record_time) AS lastLogAt FROM attendance_logs")
    .get();
  res.json({
    success: true,
    data: {
      info,
      status: getStatus(),
      sync: getSyncState(),
      stored,
    },
  });
};

const listDeviceUsers = (req, res) => {
  const rows = db
    .prepare(
      `SELECT d.device_user_id, d.uid, d.name, d.card_no, d.role, d.synced_at,
              u.id AS user_id, u.name AS user_name
       FROM device_users d LEFT JOIN users u ON u.device_user_id = d.device_user_id
       ORDER BY CAST(d.device_user_id AS INTEGER)`
    )
    .all()
    .map((r) => ({ ...r, mapped: r.user_id != null }));
  res.json({ success: true, data: rows });
};

const syncNow = async (req, res) => {
  const result = await syncAll();
  res.json({ success: true, data: result });
};

module.exports = { getDeviceInfo, listDeviceUsers, syncNow };
