import React, { useEffect, useState } from "react";
import { DocumentDownload, TaskSquare } from "iconsax-reactjs";
import { Spinner } from "@/components/ui/spinner";
import { downloadBlob, makeApiRequest } from "@/helpers/api";
import { ATTENDANCE_DATE_RANGE, ENDPOINTS } from "@/helpers/constants";
import { PageTitle } from "@/components/layout/AppLayout";
import LogsFilter from "@/components/LogsFilter";
import AttendanceGrid from "@/components/AttendanceGrid";
import OverrideDialog from "@/components/OverrideDialog";
import { StatusLegend } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { formatDateRange } from "@/helpers/format";
import { Select } from "@/components/ui/select";
import { FormError } from "@/components/ui/field";

const thisMonth = ATTENDANCE_DATE_RANGE.find((r) => r.label === "This Month");

const AttendancePage = () => {
  const [startDate, setStartDate] = useState(thisMonth.startDate);
  const [endDate, setEndDate] = useState(thisMonth.endDate);
  const [userId, setUserId] = useState("");
  const [users, setUsers] = useState([]);
  const [showPunchTimes, setShowPunchTimes] = useState(false);
  const [report, setReport] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState("");
  const [editTarget, setEditTarget] = useState(null);

  const loadReport = async (start = startDate, end = endDate, selectedUserId = userId) => {
    setIsLoading(true);
    setError("");
    try {
      const response = await makeApiRequest({
        endpoint: ENDPOINTS.ATTENDANCE,
        query: { start, end, userId: selectedUserId },
      });
      setReport(response);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const blob = await makeApiRequest({
        endpoint: ENDPOINTS.EXPORT_ATTENDANCE,
        method: "POST",
        requestBody: {
          start: report.start,
          end: report.end,
          showPunchTimes,
          ...(userId && { userId: Number(userId) }),
        },
        responseType: "blob",
      });
      downloadBlob(blob, `Attendance_Report_${report.start}_to_${report.end}.xlsx`);
    } catch (err) {
      setError(`Export failed: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    loadReport();
    makeApiRequest({ endpoint: ENDPOINTS.USERS })
      .then((r) => setUsers(r.data.filter((u) => u.is_active && u.role === "employee" && u.device_user_id)))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <PageTitle
        title="Attendance"
        description="Employees linked to the device, day by day. Hover a mark for punch times; click it to correct the day."
      />

      <LogsFilter
        onGetAttendance={(s, e) => loadReport(s, e)}
        startDate={startDate}
        endDate={endDate}
        setStartDate={setStartDate}
        setEndDate={setEndDate}
        isLoading={isLoading}
      >
        <div className="space-y-1.5">
          <label htmlFor="userFilter" className="eyebrow block px-0.5">Employee</label>
          <Select
            id="userFilter"
            value={userId}
            onChange={(e) => {
              setUserId(e.target.value);
              loadReport(startDate, endDate, e.target.value);
            }}
          >
            <option value="">All employees</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}{u.device_user_id ? ` (UID ${u.device_user_id})` : ""}
              </option>
            ))}
          </Select>
        </div>
      </LogsFilter>

      <FormError message={error} />

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="flex flex-wrap items-center gap-2 text-[15px] font-semibold">
            <TaskSquare size={18} className="text-foreground/70" />
            {report ? formatDateRange(report.start, report.end) : "Loading…"}
            {report && (
              <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                {report.rows.length} {report.rows.length === 1 ? "employee" : "employees"}
              </span>
            )}
          </h2>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex cursor-pointer items-center gap-2 text-[13px] text-foreground/80">
              <input
                type="checkbox"
                checked={showPunchTimes}
                onChange={(e) => setShowPunchTimes(e.target.checked)}
                className="size-4 accent-primary"
              />
              Punch times in export
            </label>
            <Button variant="outline" onClick={handleExport} disabled={!report || isExporting}>
              {isExporting ? <Spinner /> : <DocumentDownload />}
              Export to Excel
            </Button>
          </div>
        </div>
        <StatusLegend />
        <AttendanceGrid
          report={report}
          isLoading={isLoading}
          onCellClick={setEditTarget}
        />
      </section>

      {editTarget && (
        <OverrideDialog
          key={`${editTarget.row.userId}-${editTarget.date}`}
          target={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={() => loadReport()}
        />
      )}
    </>
  );
};

export default AttendancePage;
