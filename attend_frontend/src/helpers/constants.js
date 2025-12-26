export const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api/";

export const ENDPOINTS = {
  GET_ATTENDANCE: "zkteco/get-attendance",
  GET_DEVICE_INFO: "zkteco/get-device-info",
  EXPORT_LOGS: "zkteco/export",
};
