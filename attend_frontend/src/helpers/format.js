import { format, parseISO } from "date-fns";

// "1 – 30 November 2026", "28 Oct – 3 Nov 2026", "30 Dec 2025 – 2 Jan 2026"
export const formatDateRange = (start, end) => {
  if (!start || !end) return "";
  const s = parseISO(start);
  const e = parseISO(end);
  if (start === end) return format(s, "d MMMM yyyy");
  if (s.getFullYear() !== e.getFullYear()) return `${format(s, "d MMM yyyy")} – ${format(e, "d MMM yyyy")}`;
  if (s.getMonth() !== e.getMonth()) return `${format(s, "d MMM")} – ${format(e, "d MMM yyyy")}`;
  return `${format(s, "d")} – ${format(e, "d MMMM yyyy")}`;
};

// "Good morning" / "Good afternoon" / "Good evening" by local time
export const greeting = (date = new Date()) => {
  const h = date.getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
};
