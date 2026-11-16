const db = require("../db");
const { getSetting } = require("./settings");
const {
  toDateKey,
  parseDateKey,
  eachDateKey,
  timeToMinutes,
  formatTime12,
} = require("../helpers/dates");

const STATUS_CODES = {
  present: "P",
  late: "L",
  absent: "A",
  leave: "LV",
  holiday: "H",
  pending: "-",
  future: "",
};

const parseOverrides = (group) => {
  if (!group?.weekday_overrides) return {};
  return typeof group.weekday_overrides === "string"
    ? JSON.parse(group.weekday_overrides)
    : group.weekday_overrides;
};

// Shift times for a group on a given weekday (0 = Sunday)
const getShift = (group, weekday) => {
  if (!group) return null;
  const override = parseOverrides(group)[weekday] || {};
  return {
    start_time: override.start_time || group.start_time,
    end_time: override.end_time || group.end_time,
    is_flexible: Boolean(group.is_flexible),
  };
};

// A punch at/after shift start (and not after shift end) counts as late.
// Users without a group are never late.
const isLatePunch = (group, weekday, time) => {
  const shift = getShift(group, weekday);
  if (!shift || shift.is_flexible) return false;
  const t = timeToMinutes(time);
  return t >= timeToMinutes(shift.start_time) && t <= timeToMinutes(shift.end_time);
};

/**
 * Status for one user on one day. First matching rule wins:
 * override > holiday / weekly off > punches > absent / pending / future.
 * @param {Object} p
 * @param {String} p.date - YYYY-MM-DD
 * @param {String[]} p.punches - sorted 'HH:MM:SS' times
 * @param {Object} [p.override] - attendance_overrides row
 * @param {Boolean} p.isHoliday
 * @param {Object} [p.group] - shift_groups row
 * @param {Date} p.now
 */
const computeDayStatus = ({ date, punches, override, isHoliday, group, now }) => {
  const formatted = punches.map((t) => formatTime12(t));
  // The device doesn't mark punches as in/out, so label them by order: in, out, in, out...
  const punchEntries = formatted.map((time, i) => ({ type: i % 2 === 0 ? "in" : "out", time }));
  const cell = {
    status: null,
    punches: formatted, // device punches only
    times: formatted, // times to display: device punches, or times entered with an admin edit
    entries: punchEntries, // same times labelled in/out
    edited: false,
  };
  const weekday = parseDateKey(date).getDay();

  if (override) {
    // Show the times entered with the edit when the device recorded none
    const entered = [
      override.check_in && { type: "in", time: formatTime12(override.check_in) },
      override.check_out && { type: "out", time: formatTime12(override.check_out) },
    ].filter(Boolean);
    const useEntered = cell.punches.length === 0;
    return {
      ...cell,
      times: useEntered ? entered.map((e) => e.time) : cell.punches,
      entries: useEntered ? entered : punchEntries,
      status: override.status,
      edited: true,
      overrideId: override.id,
      reason: override.reason,
      checkIn: override.check_in,
      checkOut: override.check_out,
    };
  }

  if (isHoliday) {
    return { ...cell, status: "holiday", workedOnHoliday: punches.length > 0 };
  }

  if (punches.length > 0) {
    return {
      ...cell,
      status: isLatePunch(group, weekday, punches[0]) ? "late" : "present",
    };
  }

  const today = toDateKey(now);
  if (date > today) return { ...cell, status: "future" };
  if (date === today) {
    const shift = getShift(group, weekday);
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    if (!shift || nowMinutes <= timeToMinutes(shift.end_time)) {
      return { ...cell, status: "pending" };
    }
  }
  return { ...cell, status: "absent" };
};

const emptyTotals = () => ({ present: 0, late: 0, absent: 0, leave: 0, holiday: 0 });

/**
 * Build the daily status grid for a date range.
 * @param {Object} opts
 * @param {String} opts.start - YYYY-MM-DD
 * @param {String} opts.end - YYYY-MM-DD
 * @param {Number} [opts.userId] - limit to one app user
 * @param {Boolean} [opts.linkedOnly] - only employees linked to a device user
 * @param {Date} [opts.now]
 */
const buildReport = ({ start, end, userId = null, linkedOnly = false, now = new Date() }) => {
  const dateKeys = eachDateKey(start, end);
  const weeklyOff = getSetting("weekly_off_days") || [];

  const holidays = new Map(
    db
      .prepare("SELECT date, name FROM holidays WHERE date BETWEEN ? AND ?")
      .all(start, end)
      .map((h) => [h.date, h.name])
  );

  const days = dateKeys.map((date) => {
    const weekday = parseDateKey(date).getDay();
    const isWeeklyOff = weeklyOff.includes(weekday);
    return {
      date,
      weekday,
      isWeeklyOff,
      holidayName: holidays.get(date) || null,
      isHoliday: isWeeklyOff || holidays.has(date),
    };
  });

  const users = db
    .prepare(
      `SELECT u.id, u.name, u.device_user_id, g.id AS group_id, g.name AS group_name,
              g.start_time, g.end_time, g.weekday_overrides, g.is_flexible
       FROM users u LEFT JOIN shift_groups g ON g.id = u.shift_group_id
       WHERE u.is_active = 1 AND u.role = 'employee'
         ${linkedOnly ? "AND u.device_user_id IS NOT NULL" : ""}
         ${userId ? "AND u.id = ?" : ""}
       ORDER BY CAST(u.device_user_id AS INTEGER), u.name`
    )
    .all(...(userId ? [userId] : []));

  // punches[deviceUserId][date] = ['HH:MM:SS', ...]
  const punches = {};
  db.prepare(
    `SELECT device_user_id, record_time FROM attendance_logs
     WHERE record_time BETWEEN ? AND ? ORDER BY record_time`
  )
    .all(`${start} 00:00:00`, `${end} 23:59:59`)
    .forEach(({ device_user_id, record_time }) => {
      const [date, time] = record_time.split(" ");
      ((punches[device_user_id] ||= {})[date] ||= []).push(time);
    });

  // overrides[userId][date] = row
  const overrides = {};
  db.prepare("SELECT * FROM attendance_overrides WHERE date BETWEEN ? AND ?")
    .all(start, end)
    .forEach((o) => {
      (overrides[o.user_id] ||= {})[o.date] = o;
    });

  const buildRow = ({ user, group, deviceUserId, name, editable }) => {
    const totals = emptyTotals();
    const cells = {};
    days.forEach(({ date, isHoliday }) => {
      const cell = computeDayStatus({
        date,
        punches: punches[deviceUserId]?.[date] || [],
        override: user ? overrides[user.id]?.[date] : null,
        isHoliday,
        group,
        now,
      });
      cell.code = STATUS_CODES[cell.status];
      if (cell.status in totals) totals[cell.status] += 1;
      cells[date] = cell;
    });
    return {
      userId: user?.id ?? null,
      deviceUserId,
      name,
      shiftGroup: group?.name ?? null,
      editable,
      cells,
      totals,
    };
  };

  const rows = users.map((u) =>
    buildRow({
      user: u,
      group: u.group_id
        ? {
            name: u.group_name,
            start_time: u.start_time,
            end_time: u.end_time,
            weekday_overrides: u.weekday_overrides,
            is_flexible: u.is_flexible,
          }
        : null,
      deviceUserId: u.device_user_id,
      name: u.name,
      editable: true,
    })
  );

  return { start, end, days, rows };
};

module.exports = {
  STATUS_CODES,
  getShift,
  isLatePunch,
  computeDayStatus,
  buildReport,
};
