import React, { useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { ArrowRight, SearchNormal1 } from "iconsax-reactjs";
import { Spinner } from "./ui/spinner";
import { ATTENDANCE_DATE_RANGE } from "../helpers/constants";
import { cn } from "@/lib/utils";

// Date range toolbar: quick ranges as a segmented control, then from/to, extra filters, Show
const LogsFilter = ({
  onGetAttendance,
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  isLoading,
  defaultRange = "This Month",
  children,
}) => {
  const [selectedDateRange, setSelectedDateRange] = useState(defaultRange);

  const handleDateRangeClick = (date) => {
    setSelectedDateRange(date.label);
    setStartDate(date.startDate);
    setEndDate(date.endDate);
    onGetAttendance(date.startDate, date.endDate);
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 shadow-[0_1px_2px_rgb(24_24_27/0.03)] xl:flex-row xl:items-end">
      <div className="space-y-1.5">
        <div className="eyebrow px-0.5">Period</div>
        <div className="inline-flex flex-wrap rounded-lg bg-secondary p-1">
          {ATTENDANCE_DATE_RANGE.map((date) => (
            <button
              key={date.label}
              type="button"
              onClick={() => handleDateRangeClick(date)}
              className={cn(
                "cursor-pointer rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors",
                selectedDateRange === date.label
                  ? "bg-card text-foreground shadow-[0_1px_3px_rgb(24_24_27/0.1)]"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {date.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-end">
        <div className="space-y-1.5">
          <div className="eyebrow px-0.5">Custom range</div>
          <div className="flex items-center gap-2">
            <Input
              id="startDate"
              type="date"
              aria-label="Start date"
              className="w-[150px]"
              value={startDate || ""}
              onChange={(e) => {
                setSelectedDateRange(null);
                setStartDate(e.target.value);
              }}
            />
            <ArrowRight size={16} className="shrink-0 text-muted-foreground" />
            <Input
              id="endDate"
              type="date"
              aria-label="End date"
              className="w-[150px]"
              value={endDate || ""}
              onChange={(e) => {
                setSelectedDateRange(null);
                setEndDate(e.target.value);
              }}
            />
          </div>
        </div>
        {children && <div className="md:w-56">{children}</div>}
        <Button
          className="md:ml-auto"
          disabled={!startDate || !endDate || isLoading}
          onClick={() => onGetAttendance(startDate, endDate)}
        >
          {isLoading ? <Spinner /> : <SearchNormal1 />}
          Show records
        </Button>
      </div>
    </div>
  );
};

export default LogsFilter;
