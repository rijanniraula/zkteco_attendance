import React, { useState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { CalendarDays, Download } from "lucide-react";

const LogsFilter = ({ onGetAttendance }) => {
  const [startDate, setStartDate] = useState();
  const [endDate, setEndDate] = useState();

  const handleGetAttendance = () => {
    onGetAttendance(startDate, endDate);
  };

  return (
    <div className="border shadow-sm p-4 rounded-md">
      <div>
        <h1 className=" font-semibold">Filter Attendance Logs</h1>
        <p className="text-xs text-muted-foreground">
          Select date range to retrieve attendance records
        </p>
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
            value={startDate}
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
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <Button
          className="flex items-center gap-2"
          onClick={handleGetAttendance}
        >
          <Download className="w-4 h-4" />
          Get Attendance Logs
        </Button>
      </div>
    </div>
  );
};

export default LogsFilter;
