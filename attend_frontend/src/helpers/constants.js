import {
  startOfToday,
  endOfToday,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from "date-fns";

export const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api/";

export const ENDPOINTS = {
  GET_ATTENDANCE: "zkteco/get-attendance",
  GET_DEVICE_INFO: "zkteco/get-device-info",
  EXPORT_LOGS: "zkteco/export",
};

export const ATTENDANCE_DATE_RANGE = [
  {
    label: "Today",
    startDate: startOfToday().toISOString(),
    endDate: endOfToday().toISOString(),
  },
  {
    label: "This Week",
    startDate: startOfWeek(new Date()).toISOString(),
    endDate: endOfWeek(new Date()).toISOString(),
  },
  {
    label: "This Month",
    startDate: startOfMonth(new Date()).toISOString(),
    endDate: endOfMonth(new Date()).toISOString(),
  },
];
