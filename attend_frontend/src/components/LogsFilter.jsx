import React, { useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { CalendarDays, Download } from "lucide-react";
import { ATTENDANCE_DATE_RANGE } from "../helpers/constants";

const LogsFilter = ({
  onGetAttendance,
  startDate,
  endDate,
  setStartDate,
  setEndDate,
}) => {
  const [selectedDateRange, setSelectedDateRange] = useState(null);

  const handleGetAttendance = () => {
    onGetAttendance(startDate, endDate);
  };

  const handleDateRangeClick = (date) => {
    setSelectedDateRange(date.label);
    setStartDate(date.startDate);
    setEndDate(date.endDate);
  };

  return (
    <div className="border shadow-sm p-4 rounded-md space-y-4 bg-card">
      <div>
        <h1 className=" font-semibold">Filter Attendance Records</h1>
        <p className="text-xs text-muted-foreground">
          Select date range to retrieve attendance records
        </p>
      </div>
      <div className="flex items-center gap-2">
        {ATTENDANCE_DATE_RANGE.map((date) => (
          <Button
            key={date.label}
            variant={selectedDateRange === date.label ? "default" : "outline"}
            size="sm"
            onClick={() => handleDateRangeClick(date)}
          >
            {date.label}
          </Button>
        ))}
      </div>

      <div className="flex items-end gap-3 mt-4">
        <div className="w-full space-y-1">
          <label htmlFor="startDate" className="text-sm flex items-center">
            <CalendarDays className="w-3.5 h-3.5 mr-1" />
            <span>Start Date</span>
          </label>
          <Input
            id="startDate"
            type="date"
            className="w-full flex flex-col justify-center"
            value={
              startDate ? new Date(startDate).toISOString().split("T")[0] : ""
            }
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="w-full space-y-1">
          <label htmlFor="endDate" className="text-sm flex items-center">
            <CalendarDays className="w-3.5 h-3.5 mr-1" />
            <span>End Date</span>
          </label>
          <Input
            id="endDate"
            className="w-full flex flex-col justify-center"
            type="date"
            value={endDate ? new Date(endDate).toISOString().split("T")[0] : ""}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <Button
          className="flex items-center gap-2"
          onClick={handleGetAttendance}
        >
          <Download className="w-4 h-4" />
          Get Attendance Records
        </Button>
      </div>
    </div>
  );
};

export default LogsFilter;
