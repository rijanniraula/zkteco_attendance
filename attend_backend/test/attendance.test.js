process.env.DB_PATH = ":memory:";
process.env.JWT_SECRET ||= "test";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const { computeDayStatus, isLatePunch } = require("../src/services/attendance");

const regular = {
  start_time: "09:41",
  end_time: "16:00",
  weekday_overrides: '{"5":{"end_time":"13:15"}}',
  is_flexible: 0,
};
const partTime = { start_time: "00:00", end_time: "23:59", weekday_overrides: "{}", is_flexible: 1 };
// Thursday 2026-11-12, Friday 2026-11-13, Saturday 2026-11-14
const now = new Date(2026, 10, 12, 12, 0); // Thu noon

const day = (overrides) =>
  computeDayStatus({
    date: "2026-11-11",
    punches: [],
    override: null,
    isHoliday: false,
    group: regular,
    now,
    ...overrides,
  });

test("punch before shift start is present", () => {
  assert.equal(day({ punches: ["09:30:00", "16:05:00"] }).status, "present");
});

test("punch at or after shift start is late", () => {
  assert.equal(day({ punches: ["09:41:00"] }).status, "late");
  assert.equal(day({ punches: ["10:15:00"] }).status, "late");
});

test("flexible group is never late", () => {
  assert.equal(day({ punches: ["11:00:00"], group: partTime }).status, "present");
});

test("weekday override changes shift end", () => {
  // Friday ends 13:15, so 14:00 is past the shift and not counted as late
  assert.equal(isLatePunch(regular, 5, "14:00:00"), false);
  assert.equal(isLatePunch(regular, 4, "14:00:00"), true);
});

test("no punch on a past day is absent", () => {
  assert.equal(day({}).status, "absent");
});

test("holiday wins over punches and absence", () => {
  assert.equal(day({ isHoliday: true }).status, "holiday");
  const worked = day({ isHoliday: true, punches: ["10:00:00"] });
  assert.equal(worked.status, "holiday");
  assert.equal(worked.workedOnHoliday, true);
});

test("override wins over everything", () => {
  const cell = day({
    isHoliday: true,
    punches: ["10:00:00"],
    override: { id: 7, status: "present", reason: "Device down" },
  });
  assert.equal(cell.status, "present");
  assert.equal(cell.edited, true);
  assert.equal(cell.overrideId, 7);
});

test("today before shift end is pending, future is blank", () => {
  assert.equal(day({ date: "2026-11-12" }).status, "pending");
  assert.equal(day({ date: "2026-11-13" }).status, "future");
  const evening = new Date(2026, 10, 12, 17, 0);
  assert.equal(day({ date: "2026-11-12", now: evening }).status, "absent");
});

test("punch times are formatted for display", () => {
  assert.deepEqual(day({ punches: ["09:05:00", "16:30:00"] }).punches, ["09:05 AM", "04:30 PM"]);
});
