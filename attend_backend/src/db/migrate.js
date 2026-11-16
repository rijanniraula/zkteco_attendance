const fs = require("fs");
const path = require("path");
const db = require("./index");

const MIGRATIONS_DIR = path.join(__dirname, "migrations");

// Apply every .sql file in migrations/ that hasn't been applied yet, in name order
const migrate = () => {
  db.exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
    name TEXT PRIMARY KEY,
    applied_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  )`);

  const applied = new Set(
    db.prepare("SELECT name FROM schema_migrations").all().map((r) => r.name)
  );
  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");
    db.transaction(() => {
      db.exec(sql);
      db.prepare("INSERT INTO schema_migrations (name) VALUES (?)").run(file);
    })();
    console.log(`Applied migration ${file}`);
  }
};

if (require.main === module) {
  migrate();
}

module.exports = migrate;
