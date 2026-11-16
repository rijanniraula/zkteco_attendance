const pad = (n) => String(n).padStart(2, "0");

// Local 'YYYY-MM-DD'
const toDateKey = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// Local 'YYYY-MM-DD HH:MM:SS'
const toLocalDateTime = (d) =>
  `${toDateKey(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

// 'YYYY-MM-DD' -> local midnight Date
const parseDateKey = (key) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
};

// Every 'YYYY-MM-DD' from start to end inclusive
const eachDateKey = (start, end) => {
  const keys = [];
  const cursor = parseDateKey(start);
  const last = parseDateKey(end);
  while (cursor <= last) {
    keys.push(toDateKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return keys;
};

// 'HH:MM' or 'HH:MM:SS' -> minutes since midnight
const timeToMinutes = (t) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

// 'HH:MM' (24h) -> '09:05 AM'
const formatTime12 = (t) => {
  const [h, m] = t.split(":").map(Number);
  const hour = h % 12 || 12;
  return `${pad(hour)}:${pad(m)} ${h >= 12 ? "PM" : "AM"}`;
};

module.exports = {
  toDateKey,
  toLocalDateTime,
  parseDateKey,
  eachDateKey,
  timeToMinutes,
  formatTime12,
};
