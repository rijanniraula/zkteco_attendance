// One-time import of the old hard-coded helpers/usersMap.js into the users table.
// Each entry becomes an employee mapped to its device user ID, with a placeholder
// email (user<id>@attendance.local) and IMPORT_DEFAULT_PASSWORD; they must change it on first login.
// Usage: IMPORT_DEFAULT_PASSWORD=... npm run import:usermap [path/to/usersMap.js]
require("dotenv").config();
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const db = require("../db");
const migrate = require("../db/migrate");

// Group membership that used to live in config/constants.js
const STAFF_UIDS = [7, 21, 24, 25];
const PART_TIME_UIDS = [2];

const mapPath = path.resolve(process.argv[2] || path.join(__dirname, "../helpers/usersMap.js"));
const password = process.env.IMPORT_DEFAULT_PASSWORD;

if (!fs.existsSync(mapPath)) {
  console.error(`usersMap file not found: ${mapPath}`);
  process.exit(1);
}
if (!password || password.length < 8) {
  console.error("Set IMPORT_DEFAULT_PASSWORD (8+ characters) for the imported accounts");
  process.exit(1);
}

migrate();

const { users } = require(mapPath);
const groupId = (name) => db.prepare("SELECT id FROM shift_groups WHERE name = ?").get(name)?.id ?? null;
const groups = { Regular: groupId("Regular"), Staff: groupId("Staff"), "Part-time": groupId("Part-time") };
const hash = bcrypt.hashSync(password, 10);

const insert = db.prepare(
  `INSERT INTO users (name, email, password_hash, role, device_user_id, shift_group_id)
   VALUES (?, ?, ?, 'employee', ?, ?)`
);
const exists = db.prepare("SELECT 1 FROM users WHERE device_user_id = ?");

let created = 0;
db.transaction(() => {
  for (const { userId, displayName } of users) {
    const deviceId = String(userId);
    if (exists.get(deviceId)) continue;
    const group = STAFF_UIDS.includes(Number(userId))
      ? groups.Staff
      : PART_TIME_UIDS.includes(Number(userId))
        ? groups["Part-time"]
        : groups.Regular;
    insert.run(displayName, `user${deviceId}@attendance.local`, hash, deviceId, group);
    created += 1;
  }
})();

console.log(`Imported ${created} of ${users.length} users (existing device mappings skipped)`);
