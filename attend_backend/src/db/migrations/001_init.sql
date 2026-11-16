CREATE TABLE shift_groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  start_time TEXT NOT NULL,              -- HH:MM, punches at/after this are late
  end_time TEXT NOT NULL,                -- HH:MM
  weekday_overrides TEXT NOT NULL DEFAULT '{}', -- JSON {"5": {"end_time": "13:15"}}
  is_flexible INTEGER NOT NULL DEFAULT 0, -- 1 = never late
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('super_admin', 'employee')),
  device_user_id TEXT UNIQUE,
  shift_group_id INTEGER REFERENCES shift_groups(id) ON DELETE SET NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  must_change_password INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE device_users (
  device_user_id TEXT PRIMARY KEY,
  uid INTEGER,
  name TEXT,
  card_no TEXT,
  role INTEGER,
  synced_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE attendance_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_user_id TEXT NOT NULL,
  record_time TEXT NOT NULL,             -- local 'YYYY-MM-DD HH:MM:SS'
  type INTEGER,
  state INTEGER,
  source TEXT NOT NULL DEFAULT 'sync',   -- sync | realtime
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  UNIQUE (device_user_id, record_time)
);
CREATE INDEX idx_attendance_logs_time ON attendance_logs (record_time);

CREATE TABLE holidays (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL UNIQUE,             -- YYYY-MM-DD
  name TEXT NOT NULL,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE attendance_overrides (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,                    -- YYYY-MM-DD
  status TEXT NOT NULL CHECK (status IN ('present', 'late', 'absent', 'leave', 'holiday')),
  check_in TEXT,                         -- HH:MM
  check_out TEXT,                        -- HH:MM
  reason TEXT NOT NULL,
  updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  UNIQUE (user_id, date)
);

CREATE TABLE audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT,
  before TEXT,
  after TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

INSERT INTO shift_groups (name, start_time, end_time, weekday_overrides, is_flexible) VALUES
  ('Regular',   '09:41', '16:00', '{"5":{"end_time":"13:15"}}', 0),
  ('Staff',     '08:45', '16:00', '{"5":{"end_time":"13:15"}}', 0),
  ('Part-time', '00:00', '23:59', '{}', 1);

INSERT INTO settings (key, value) VALUES
  ('weekly_off_days', '[0,6]'),
  ('sync_interval_min', '5'),
  ('zk_ip', '""');
