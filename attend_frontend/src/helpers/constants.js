import {
  startOfToday,
  endOfToday,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subMonths,
  format,
} from "date-fns";

export const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api/";

export const TOKEN_KEY = "attendance_token";

export const ENDPOINTS = {
  LOGIN: "auth/login",
  ME: "auth/me",
  CHANGE_PASSWORD: "auth/change-password",
  MY_ATTENDANCE: "me/attendance",
  USERS: "admin/users",
  DEVICE_INFO: "admin/device/info",
  DEVICE_USERS: "admin/device/users",
  DEVICE_SYNC: "admin/device/sync",
  ATTENDANCE: "admin/attendance",
  EXPORT_ATTENDANCE: "admin/attendance/export",
  OVERRIDE: "admin/attendance/override",
  HOLIDAYS: "admin/holidays",
  SETTINGS: "admin/settings",
  SHIFT_GROUPS: "admin/shift-groups",
};

const fmt = (d) => format(d, "yyyy-MM-dd");

export const ATTENDANCE_DATE_RANGE = [
  {
    label: "Today",
    get startDate() {
      return fmt(startOfToday());
    },
    get endDate() {
      return fmt(endOfToday());
    },
  },
  {
    label: "This Week",
    get startDate() {
      return fmt(startOfWeek(new Date(), { weekStartsOn: 0 }));
    },
    get endDate() {
      return fmt(endOfWeek(new Date(), { weekStartsOn: 0 }));
    },
  },
  {
    label: "This Month",
    get startDate() {
      return fmt(startOfMonth(new Date()));
    },
    get endDate() {
      return fmt(endOfMonth(new Date()));
    },
  },
  {
    label: "Last Month",
    get startDate() {
      return fmt(startOfMonth(subMonths(new Date(), 1)));
    },
    get endDate() {
      return fmt(endOfMonth(subMonths(new Date(), 1)));
    },
  },
];

// Display info for each daily status returned by the API
export const STATUS_META = {
  present: { label: "Present", code: "P", className: "bg-present-bg text-present" },
  late: { label: "Late", code: "L", className: "bg-late-bg text-late" },
  absent: { label: "Absent", code: "A", className: "bg-absent-bg text-absent" },
  leave: { label: "Leave", code: "LV", className: "bg-leave-bg text-leave" },
  holiday: { label: "Holiday", code: "H", className: "bg-holiday-bg text-holiday" },
  pending: { label: "Pending", code: "–", className: "bg-transparent text-muted-foreground ring-1 ring-inset ring-dashed ring-rule" },
  future: { label: "", code: "", className: "" },
};

export const EDITABLE_STATUSES = ["present", "late", "absent", "leave", "holiday"];

export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
