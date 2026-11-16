const { z } = require("zod");

const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD");
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must be HH:MM");

const dateRange = z
  .object({ start: dateKey, end: dateKey })
  .refine((v) => v.start <= v.end, "Start date must be before end date");

module.exports = { z, dateKey, time, dateRange };
