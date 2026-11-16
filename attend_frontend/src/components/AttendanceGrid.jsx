import React from "react";
import { format, parseISO } from "date-fns";
import { Spinner } from "./ui/spinner";
import { Avatar } from "./ui/avatar";
import StatusBadge from "./StatusBadge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { STATUS_META } from "@/helpers/constants";
import { cn } from "@/lib/utils";

const TOTAL_TONES = {
  present: "text-present",
  late: "text-late",
  absent: "text-absent",
  leave: "text-leave",
  holiday: "text-holiday",
};

const TOTALS = [
  ["P", "present"],
  ["L", "late"],
  ["A", "absent"],
  ["LV", "leave"],
  ["H", "holiday"],
];

// Hover details for one day: status, labelled in/out times, edit reason
const CellDetails = ({ day, cell }) => (
  <div className="min-w-44 space-y-2">
    <div className="flex items-center justify-between gap-4 border-b border-border pb-1.5">
      <span className="text-[13px] font-semibold">{format(parseISO(day.date), "EEE, d MMM")}</span>
      <StatusBadge status={cell.status} edited={cell.edited} />
    </div>
    {day.holidayName && <div className="text-muted-foreground">{day.holidayName}</div>}
    {cell.entries.length > 0 ? (
      <table className="w-full">
        <tbody>
          {cell.entries.map((e, i) => (
            <tr key={i}>
              <td className={cn("py-0.5 pr-4 text-xs font-medium", e.type === "in" ? "text-present" : "text-absent")}>
                {e.type === "in" ? "In" : "Out"}
              </td>
              <td className="py-0.5 text-right font-mono">{e.time}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ) : (
      <div className="text-muted-foreground">No punches recorded</div>
    )}
    {cell.edited && (
      <div className="border-t border-border pt-1.5 text-muted-foreground">
        <span className="text-highlight">Edited</span> · {cell.reason}
        {cell.punches.length === 0 && cell.entries.length > 0 && " (times entered by admin)"}
      </div>
    )}
  </div>
);

// Users × days status grid. Editable cells call onCellClick({ row, date, cell }).
const AttendanceGrid = ({ report, isLoading, onCellClick }) => {
  // Keep the previous grid on screen while reloading so the page doesn't jump
  if (isLoading && !report) {
    return (
      <div className="flex justify-center items-center h-32">
        <Spinner className="size-5 text-muted-foreground" />
      </div>
    );
  }
  if (!report?.rows?.length) {
    return (
      <div className="h-32 flex items-center justify-center text-[13px] text-muted-foreground">
        No employees linked to the device yet. Link them on the Users page.
      </div>
    );
  }

  const today = format(new Date(), "yyyy-MM-dd");

  return (
    <TooltipProvider delayDuration={120}>
      <div className={cn("overflow-x-auto rounded-xl border border-border bg-card shadow-[0_1px_2px_rgb(24_24_27/0.03)] transition-opacity", isLoading && "opacity-50")}>
        <table className="w-full border-collapse text-sm tabular-nums">
          <thead>
            <tr className="border-b border-border bg-[#fafafb]">
              <th className="sticky left-0 z-10 min-w-56 border-r border-border bg-[#fafafb] px-4 py-2 text-left align-middle text-[13px] font-medium text-foreground/80">
                Employee
              </th>
              {report.days.map((d) => (
                <th
                  key={d.date}
                  className="min-w-9 px-0.5 py-2 text-center font-normal"
                  title={d.holidayName || (d.isWeeklyOff ? "Weekly off" : "")}
                >
                  <div
                    className={cn(
                      "mx-auto flex w-8 flex-col items-center rounded-md py-1 leading-tight",
                      d.date === today
                        ? "bg-highlight text-white shadow-[0_2px_6px_rgb(236_72_153/0.35)]"
                        : d.isHoliday
                          ? "text-muted-foreground/70"
                          : "text-foreground"
                    )}
                  >
                    <span className={cn("text-[10px]", d.date !== today && "text-muted-foreground")}>
                      {format(parseISO(d.date), "EEEEEE")}
                    </span>
                    <span className="text-[13px] font-semibold">{Number(d.date.slice(8))}</span>
                  </div>
                </th>
              ))}
              {TOTALS.map(([label, key], i) => (
                <th
                  key={label}
                  className={cn("px-2 py-2 text-center text-xs font-semibold", TOTAL_TONES[key], i === 0 && "border-l border-border")}
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {report.rows.map((row) => (
              <tr key={row.userId ?? `d${row.deviceUserId}`} className="group/row border-b border-border last:border-0">
                <td className="sticky left-0 z-10 border-r border-border bg-card px-4 py-2 group-hover/row:bg-[#fafafb]">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={row.name} className={cn("size-7 text-[10px]", !row.editable && "bg-secondary text-muted-foreground")} />
                    <div className="min-w-0 leading-tight">
                      <div className={cn("truncate text-[13px] font-medium", !row.editable && "text-muted-foreground")}>{row.name}</div>
                      <div className="mt-0.5 text-[11px] text-muted-foreground">
                        {row.deviceUserId ? `#${row.deviceUserId}` : "no device ID"}
                        {row.shiftGroup && ` · ${row.shiftGroup}`}
                        {!row.editable && " · not linked"}
                      </div>
                    </div>
                  </div>
                </td>
                {report.days.map((d) => {
                  const cell = row.cells[d.date];
                  const editable = row.editable && cell.status !== "future";
                  return (
                    <td
                      key={d.date}
                      className={cn(
                        "px-0.5 py-1.5 text-center group-hover/row:bg-[#fafafb]",
                        d.isHoliday && "hatch",
                        d.date === today && "bg-highlight-soft/40"
                      )}
                    >
                      {STATUS_META[cell.status]?.code ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            {/* aria-disabled instead of disabled so the tooltip still works on read-only cells */}
                            <button
                              type="button"
                              aria-disabled={!editable}
                              onClick={() => editable && onCellClick({ row, date: d.date, cell })}
                              className={cn(
                                "group rounded-md align-middle outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                                editable ? "cursor-pointer" : "cursor-default"
                              )}
                            >
                              <StatusBadge
                                status={cell.status}
                                edited={cell.edited}
                                compact
                                className={cn(
                                  "transition-transform",
                                  editable && "group-hover:ring-2 group-hover:ring-primary/30"
                                )}
                              />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <CellDetails day={d} cell={cell} />
                          </TooltipContent>
                        </Tooltip>
                      ) : null}
                    </td>
                  );
                })}
                {TOTALS.map(([label, key], i) => (
                  <td
                    key={label}
                    className={cn(
                      "px-2 py-1.5 text-center text-[13px] font-semibold group-hover/row:bg-[#fafafb]",
                      row.totals[key] ? TOTAL_TONES[key] : "text-muted-foreground/40",
                      i === 0 && "border-l border-border"
                    )}
                  >
                    {row.totals[key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </TooltipProvider>
  );
};

export default AttendanceGrid;
