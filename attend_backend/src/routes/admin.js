const express = require("express");
const { requireAuth, requireRole } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { z, dateKey, time, dateRange } = require("../helpers/schemas");
const users = require("../controllers/admin/users");
const device = require("../controllers/admin/device");
const attendance = require("../controllers/admin/attendance");
const holidays = require("../controllers/admin/holidays");
const settings = require("../controllers/admin/settings");

const router = express.Router();

router.use(requireAuth, requireRole("super_admin"));

// users
const userFields = {
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("Valid email is required"),
  role: z.enum(["super_admin", "employee"]),
  device_user_id: z.string().trim().nullable().optional(),
  shift_group_id: z.number().int().nullable().optional(),
  is_active: z.boolean().optional(),
};
const password = z.string().min(8, "Password must be at least 8 characters");

router.get("/users", users.listUsers);
router.post(
  "/users",
  validate(z.object({ ...userFields, role: userFields.role.default("employee"), password })),
  users.createUser
);
router.patch(
  "/users/:id",
  validate(z.object({ ...userFields, password: password.optional() }).partial()),
  users.updateUser
);
router.delete("/users/:id", users.deleteUser);

// device
router.get("/device/info", device.getDeviceInfo);
router.get("/device/users", device.listDeviceUsers);
router.post("/device/sync", device.syncNow);

// attendance report + overrides
const reportQuery = dateRange.and(
  z.object({ userId: z.coerce.number().int().optional() })
);
router.get("/attendance", validate(reportQuery, "query"), attendance.getReport);
router.post(
  "/attendance/export",
  validate(
    dateRange.and(
      z.object({
        userId: z.number().int().optional(),
        showPunchTimes: z.boolean().optional().default(false),
      })
    )
  ),
  attendance.exportReport
);
router.put(
  "/attendance/override",
  validate(
    z.object({
      userId: z.number().int(),
      date: dateKey,
      status: z.enum(["present", "late", "absent", "leave", "holiday"]),
      check_in: time.nullable().optional(),
      check_out: time.nullable().optional(),
      reason: z.string().trim().min(1, "A reason is required"),
    })
    .refine(
      (v) => !v.check_in || !v.check_out || v.check_in <= v.check_out,
      "Check-out must be after check-in"
    )
  ),
  attendance.upsertOverride
);
router.delete("/attendance/override/:id", attendance.deleteOverride);

// holidays
router.get(
  "/holidays",
  validate(z.object({ year: z.string().regex(/^\d{4}$/).optional() }), "query"),
  holidays.listHolidays
);
router.post(
  "/holidays",
  validate(
    z
      .object({
        date: dateKey,
        endDate: dateKey.optional(),
        name: z.string().trim().min(1, "Name is required"),
      })
      .refine((v) => !v.endDate || v.endDate >= v.date, "End date must be on or after the start date")
  ),
  holidays.createHoliday
);
router.post(
  "/holidays/delete",
  validate(z.object({ ids: z.array(z.number().int()).min(1) })),
  holidays.deleteHolidays
);
router.delete("/holidays/:id", holidays.deleteHoliday);

// settings
router.get("/settings", settings.getSettings);
router.put(
  "/settings",
  validate(
    z
      .object({
        weekly_off_days: z.array(z.number().int().min(0).max(6)),
        sync_interval_min: z.number().int().min(1).max(1440),
        zk_ip: z.union([z.ipv4(), z.literal("")]),
      })
      .partial()
  ),
  settings.updateSettings
);

// shift groups
const shiftGroup = z.object({
  name: z.string().trim().min(1, "Name is required"),
  start_time: time,
  end_time: time,
  weekday_overrides: z
    .record(
      z.string().regex(/^[0-6]$/),
      z.object({ start_time: time.optional(), end_time: time.optional() })
    )
    .optional(),
  is_flexible: z.boolean().optional(),
});
router.get("/shift-groups", settings.listShiftGroups);
router.post("/shift-groups", validate(shiftGroup), settings.createShiftGroup);
router.put("/shift-groups/:id", validate(shiftGroup), settings.updateShiftGroup);
router.delete("/shift-groups/:id", settings.deleteShiftGroup);

module.exports = router;
