// Create (or reset) the super admin from SEED_ADMIN_* env vars.
// Usage: npm run seed:admin
require("dotenv").config();
const bcrypt = require("bcryptjs");
const db = require("../db");
const migrate = require("../db/migrate");

const { SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD, SEED_ADMIN_NAME = "Super Admin" } = process.env;

if (!SEED_ADMIN_EMAIL || !SEED_ADMIN_PASSWORD) {
  console.error("Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in .env first");
  process.exit(1);
}
if (SEED_ADMIN_PASSWORD.length < 8) {
  console.error("SEED_ADMIN_PASSWORD must be at least 8 characters");
  process.exit(1);
}

migrate();

const hash = bcrypt.hashSync(SEED_ADMIN_PASSWORD, 10);
const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(SEED_ADMIN_EMAIL);

if (existing) {
  db.prepare(
    `UPDATE users SET password_hash = ?, role = 'super_admin', is_active = 1,
     updated_at = datetime('now', 'localtime') WHERE id = ?`
  ).run(hash, existing.id);
  console.log(`Super admin ${SEED_ADMIN_EMAIL} updated (password reset)`);
} else {
  db.prepare(
    `INSERT INTO users (name, email, password_hash, role, must_change_password)
     VALUES (?, ?, ?, 'super_admin', 0)`
  ).run(SEED_ADMIN_NAME, SEED_ADMIN_EMAIL, hash);
  console.log(`Super admin ${SEED_ADMIN_EMAIL} created`);
}
