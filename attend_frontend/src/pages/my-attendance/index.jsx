import React, { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { makeApiRequest } from "@/helpers/api";
import { ATTENDANCE_DATE_RANGE, ENDPOINTS } from "@/helpers/constants";
import { formatDateRange, greeting } from "@/helpers/format";
import { Calendar, Chart, Clock, Login, Logout, Note1, Status } from "iconsax-reactjs";
import { useAuth } from "@/context/AuthContext";
import { PageTitle } from "@/components/layout/AppLayout";
import LogsFilter from "@/components/LogsFilter";
import TotalsCards from "@/components/TotalsCards";
import StatusBadge from "@/components/StatusBadge";
import { DataTable } from "@/components/common/DataTable";
import { FormError } from "@/components/ui/field";
import { cn } from "@/lib/utils";

const COLUMNS = [
  { header: "Date", key: "date", className: "w-40", icon: Calendar },
  { header: "Status", key: "status", className: "w-32", icon: Status },
  { header: "In", key: "in", className: "w-28", icon: Login },
  { header: "Out", key: "out", className: "w-28", icon: Logout },
  { header: "All punches", key: "punches", className: "hidden md:table-cell", icon: Clock },
  { header: "Note", key: "note", icon: Note1 },
];

const thisMonth = ATTENDANCE_DATE_RANGE.find((r) => r.label === "This Month");

const Time = ({ value }) =>
  value ? <span className="font-mono text-[13px]">{value}</span> : <span className="text-muted-foreground/60">—</span>;

const MyAttendancePage = () => {
  const { user } = useAuth();
  const [startDate, setStartDate] = useState(thisMonth.startDate);
  const [endDate, setEndDate] = useState(thisMonth.endDate);
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGetAttendance = async (start, end) => {
    setIsLoading(true);
    setError("");
    try {
      const response = await makeApiRequest({
        endpoint: ENDPOINTS.MY_ATTENDANCE,
        query: { start, end },
      });
      setData(response);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleGetAttendance(startDate, endDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Newest first, skip future days
  const rows = (data?.days || [])
    .filter(({ date }) => data.row?.cells[date]?.status !== "future")
    .reverse()
    .map(({ date, holidayName }) => {
      const cell = data.row.cells[date];
      const d = parseISO(date);
      const firstIn = cell.entries.find((e) => e.type === "in")?.time;
      const lastOut = [...cell.entries].reverse().find((e) => e.type === "out")?.time;
      return {
        date: (
          <div className={cn("flex items-baseline gap-2", cell.status === "holiday" && "text-muted-foreground")}>
            <span className="w-6 text-right text-[15px] font-semibold leading-none">{format(d, "d")}</span>
            <span className="text-xs uppercase tracking-wider text-muted-foreground">{format(d, "EEE · MMM")}</span>
          </div>
        ),
        status: <StatusBadge status={cell.status} edited={cell.edited} />,
        in: <Time value={firstIn} />,
        out: <Time value={lastOut} />,
        punches: cell.times.length > 2
          ? <span className="font-mono text-xs text-muted-foreground">{cell.times.join("  ·  ")}</span>
          : null,
        note: cell.edited
          ? <span className="text-[13px]"><span className="font-medium text-highlight">Corrected</span> · {cell.reason}</span>
          : holidayName
            ? <span className="text-muted-foreground">{holidayName}</span>
            : null,
      };
    });

  const firstName = user?.name?.split(" ")[0];

  return (
    <>
      <PageTitle
        title={`${greeting()}, ${firstName}`}
        description="Your attendance record as the office device saw it, with any corrections from an administrator."
      />

      {data && !data.deviceMapped && (
        <div className="rounded-xl bg-late-bg/50 px-4 py-3 text-[13px] text-late">
          <span className="font-medium">Not linked to the device yet.</span>{" "}
          Your punches will appear once an administrator links your account to your device ID.
        </div>
      )}

      <LogsFilter
        onGetAttendance={handleGetAttendance}
        startDate={startDate}
        endDate={endDate}
        setStartDate={setStartDate}
        setEndDate={setEndDate}
        isLoading={isLoading}
      />
      <FormError message={error} />

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-[15px] font-semibold">
          <Chart size={18} className="text-foreground/70" />
          {data ? formatDateRange(data.start, data.end) : "Loading…"}
        </h2>
        <TotalsCards totals={data?.row?.totals} />
      </section>

      <section className="overflow-hidden rounded-xl border border-border bg-card shadow-[0_1px_2px_rgb(24_24_27/0.03)]">
        <DataTable
          data={rows}
          columns={COLUMNS}
          isLoading={isLoading}
          emptyMessage="No days in this range yet."
        />
      </section>
    </>
  );
};

export default MyAttendancePage;
