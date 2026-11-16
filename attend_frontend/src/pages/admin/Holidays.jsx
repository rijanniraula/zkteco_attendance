import React, { useEffect, useState } from "react";
import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";
import { Add, Calendar, CalendarAdd, Note1, Timer1, Trash } from "iconsax-reactjs";
import { Spinner } from "@/components/ui/spinner";
import { makeApiRequest } from "@/helpers/api";
import { ENDPOINTS, WEEKDAYS } from "@/helpers/constants";
import { PageTitle } from "@/components/layout/AppLayout";
import { DataTable } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Field, FormError, FormSuccess } from "@/components/ui/field";
import { cn } from "@/lib/utils";

const COLUMNS = [
  { icon: Calendar, header: "Date", key: "date" },
  { icon: Timer1, header: "Days", key: "day" },
  { icon: Note1, header: "Name", key: "name" },
  { header: "", key: "actions" },
];

// Merge back-to-back dates with the same name into one range: [{ name, start, end, ids }]
const groupHolidays = (holidays) => {
  const groups = [];
  holidays.forEach((h) => {
    const last = groups[groups.length - 1];
    const isNextDay =
      last && format(addDays(parseISO(last.end), 1), "yyyy-MM-dd") === h.date;
    if (last && isNextDay && last.name === h.name) {
      last.end = h.date;
      last.ids.push(h.id);
    } else {
      groups.push({ name: h.name, start: h.date, end: h.date, ids: [h.id] });
    }
  });
  return groups;
};

const formatRange = ({ start, end }) => {
  const s = parseISO(start);
  const e = parseISO(end);
  if (start === end) return format(s, "dd MMM yyyy");
  const startFormat = s.getFullYear() !== e.getFullYear() ? "dd MMM yyyy" : s.getMonth() !== e.getMonth() ? "dd MMM" : "dd";
  return `${format(s, startFormat)} – ${format(e, "dd MMM yyyy")}`;
};

const currentYear = new Date().getFullYear();
const YEARS = [currentYear - 1, currentYear, currentYear + 1];

const HolidaysPage = () => {
  const [weeklyOff, setWeeklyOff] = useState([]);
  const [savedWeeklyOff, setSavedWeeklyOff] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [year, setYear] = useState(String(currentYear));
  const [form, setForm] = useState({ date: "", endDate: "", name: "" });
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const loadHolidays = async (y = year) => {
    setIsLoading(true);
    try {
      const response = await makeApiRequest({ endpoint: ENDPOINTS.HOLIDAYS, query: { year: y } });
      setHolidays(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHolidays();
    makeApiRequest({ endpoint: ENDPOINTS.SETTINGS })
      .then((r) => {
        setWeeklyOff(r.data.weekly_off_days);
        setSavedWeeklyOff(r.data.weekly_off_days);
      })
      .catch((err) => setError(err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleDay = (day) =>
    setWeeklyOff((days) =>
      days.includes(day) ? days.filter((d) => d !== day) : [...days, day].sort()
    );

  const saveWeeklyOff = async () => {
    setIsSaving(true);
    setError("");
    try {
      const r = await makeApiRequest({
        endpoint: ENDPOINTS.SETTINGS,
        method: "PUT",
        requestBody: { weekly_off_days: weeklyOff },
      });
      setSavedWeeklyOff(r.data.weekly_off_days);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const addHoliday = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      const r = await makeApiRequest({
        endpoint: ENDPOINTS.HOLIDAYS,
        method: "POST",
        requestBody: {
          date: form.date,
          name: form.name,
          ...(form.endDate && form.endDate !== form.date && { endDate: form.endDate }),
        },
      });
      const added = r.data.length;
      setMessage(
        `Added ${added} day${added === 1 ? "" : "s"}` +
          (r.skipped.length ? `. Skipped ${r.skipped.join(", ")} (already a holiday).` : ".")
      );
      setForm({ date: "", endDate: "", name: "" });
      const addedYear = form.date.slice(0, 4);
      setYear(addedYear);
      loadHolidays(addedYear);
    } catch (err) {
      setError(err.message);
    }
  };

  const removeHoliday = async (group) => {
    const days = group.ids.length;
    const what = days === 1 ? `on ${formatRange(group)}` : `(${days} days, ${formatRange(group)})`;
    if (!window.confirm(`Remove holiday "${group.name}" ${what}?`)) return;
    setMessage("");
    try {
      await makeApiRequest({
        endpoint: `${ENDPOINTS.HOLIDAYS}/delete`,
        method: "POST",
        requestBody: { ids: group.ids },
      });
      loadHolidays();
    } catch (err) {
      setError(err.message);
    }
  };

  const weeklyOffChanged = JSON.stringify(weeklyOff) !== JSON.stringify(savedWeeklyOff);

  const rows = groupHolidays(holidays).map((g) => ({
    date: formatRange(g),
    day:
      g.start === g.end
        ? format(parseISO(g.start), "EEEE")
        : `${g.ids.length} days (${format(parseISO(g.start), "EEE")} – ${format(parseISO(g.end), "EEE")})`,
    name: g.name,
    actions: (
      <div className="flex justify-end">
        <Button variant="ghost" size="icon" className="text-destructive" title="Remove"
          onClick={() => removeHoliday(g)}>
          <Trash />
        </Button>
      </div>
    ),
  }));

  return (
    <>
      <PageTitle title="Holidays" description="Days nobody is expected in. They show as H in the register and never count as absent." />
      <FormError message={error} />

      <Card>
        <CardHeader icon={Calendar} title="Weekly days off" description="Applied to every week. Default: Saturday and Sunday.">
          <Button onClick={saveWeeklyOff} disabled={!weeklyOffChanged || isSaving} size="sm">
            {isSaving && <Spinner />}
            Save
          </Button>
        </CardHeader>
        <div className="grid grid-cols-7 gap-2">
          {WEEKDAYS.map((name, day) => {
            const off = weeklyOff.includes(day);
            return (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                aria-pressed={off}
                className={cn(
                  "flex cursor-pointer flex-col items-center gap-1 rounded-xl border py-3 text-center transition-colors",
                  off
                    ? "border-transparent bg-highlight-soft text-highlight"
                    : "border-border bg-card hover:border-primary/40 hover:bg-primary-soft/40"
                )}
              >
                <span className="text-[15px] font-semibold leading-none">{name.slice(0, 3)}</span>
                <span className={cn("text-[11px]", off ? "text-highlight" : "text-muted-foreground")}>
                  {off ? "Day off" : "Working"}
                </span>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground">Click a day to switch it between working and day off, then save.</p>
      </Card>

      <Card>
        <CardHeader icon={CalendarAdd} title="Specific holidays" description="Public holidays, festivals and office closures">
          <Select value={year} onChange={(e) => { setYear(e.target.value); loadHolidays(e.target.value); }}
            className="w-28" aria-label="Year">
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </Select>
        </CardHeader>
        <form onSubmit={addHoliday} className="flex flex-col md:flex-row md:items-end gap-3">
          <Field label="Start date" htmlFor="holidayDate" className="md:w-48">
            <Input id="holidayDate" type="date" value={form.date} required
              onChange={(e) => {
                const date = e.target.value;
                // Keep the end date valid when the start moves past it
                setForm({ ...form, date, endDate: form.endDate && form.endDate < date ? "" : form.endDate });
              }} />
          </Field>
          <Field label="End date (optional)" htmlFor="holidayEndDate" className="md:w-48">
            <Input id="holidayEndDate" type="date" value={form.endDate} min={form.date || undefined}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
          </Field>
          <Field label="Name" htmlFor="holidayName" className="flex-1">
            <Input id="holidayName" value={form.name} required placeholder="e.g. Dashain"
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Button type="submit"><Add /> Add holiday</Button>
        </form>
        {form.date && form.endDate && form.endDate > form.date && (
          <p className="text-xs text-muted-foreground -mt-2">
            Adds {differenceInCalendarDays(parseISO(form.endDate), parseISO(form.date)) + 1} days,
            one for each date from {format(parseISO(form.date), "dd MMM")} to {format(parseISO(form.endDate), "dd MMM yyyy")}.
          </p>
        )}
        <FormSuccess message={message} />
        <DataTable data={rows} columns={COLUMNS} isLoading={isLoading} />
      </Card>
    </>
  );
};

export default HolidaysPage;
