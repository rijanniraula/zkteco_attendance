import React, { useEffect, useMemo, useState } from "react";
import { makeApiRequest } from "@/helpers/api";
import { ENDPOINTS } from "@/helpers/constants";
// import { dummyDeviceInfo } from "@/lib/dummyData";
import StatsCard from "@/components/StatsCard";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  XCircle,
  Users,
  Logs,
  Calculator,
  Download,
  Loader2,
  RefreshCw,
  OctagonAlert,
} from "lucide-react";
import LogsFilter from "@/components/LogsFilter";
import { DataTable } from "@/components/common/DataTable";
import { Button } from "@/components/ui/button";

const HomePage = () => {
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [startDate, setStartDate] = useState();
  const [endDate, setEndDate] = useState();
  const [deviceInfo, setDeviceInfo] = useState({
    success: "Disconnected",
    userCounts: 0,
    logCounts: 0,
    logCapacity: 0,
    deviceName: "",
  });
  const [isDeviceInfoLoading, setIsDeviceInfoLoading] = useState(false);
  const [isAttendanceLogsLoading, setIsAttendanceLogsLoading] = useState(false);

  const deviceInfoMap = useMemo(() => {
    return [
      {
        title: "Status",
        value: (
          <Badge
            variant={
              deviceInfo.success === "Connected" ? "success" : "destructive"
            }
          >
            {deviceInfo.success === "Connected" ? "Connected" : "Disconnected"}
          </Badge>
        ),
        icon: deviceInfo.success === "Connected" ? CheckCircle : XCircle,
      },
      {
        title: "User Counts",
        value: deviceInfo.userCounts,
        icon: Users,
      },
      {
        title: "Log Counts",
        value: (
          <>
            {deviceInfo.logCounts} / {deviceInfo.logCapacity}
          </>
        ),
        icon: Logs,
      },

      {
        title: "Device Name",
        value: deviceInfo.deviceName,
        icon: Calculator,
      },
    ];
  }, [deviceInfo]);

  //get device info
  const handleGetDeviceInfo = async () => {
    // setDeviceInfo({ ...dummyDeviceInfo, success: "Disconnected" });
    setIsDeviceInfoLoading(true);
    try {
      const response = await makeApiRequest({
        endpoint: ENDPOINTS.GET_DEVICE_INFO,
      });
      if (response.success) {
        setDeviceInfo({
          ...response?.data,
          success: response.success ? "Connected" : "Disconnected",
        });
      } else {
        setDeviceInfo({
          success: "Disconnected",
          userCounts: 0,
          logCounts: 0,
          logCapacity: 0,
          deviceName: "",
        });
      }
    } catch (error) {
      console.error("Error getting device info", error);
    } finally {
      setIsDeviceInfoLoading(false);
    }
  };

  //get attendance logs
  const handleGetAttendance = async (startDate, endDate) => {
    setStartDate(startDate);
    setEndDate(endDate);
    setIsAttendanceLogsLoading(true);
    try {
      const response = await makeApiRequest({
        endpoint: ENDPOINTS.GET_ATTENDANCE,
        method: "POST",
        requestBody: { startDate, endDate },
      });
      if (response.success) {
        setAttendanceLogs(response);
      } else {
        console.error("Failed to get attendance logs");
      }
    } catch (error) {
      console.error("Error getting attendance logs", error);
    } finally {
      setIsAttendanceLogsLoading(false);
    }
  };

  //export logs
  const handleExportLogs = async () => {
    if (!startDate || !endDate) {
      alert("Please select a date range first");
      return;
    }

    try {
      // Fetch the Excel file as a blob
      const blob = await makeApiRequest({
        endpoint: ENDPOINTS.EXPORT_LOGS,
        method: "POST",
        requestBody: { startDate, endDate },
        responseType: "blob",
      });

      console.log("Excel file received, size:", blob.size, "bytes");

      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Attendance_Report_${startDate}_to_${endDate}.xlsx`;

      // Trigger download
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting logs", error);
      alert("Failed to export logs. Please try again.");
    }
  };

  useEffect(() => {
    handleGetDeviceInfo();
  }, []);

  if (isDeviceInfoLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-12 h-12 animate-spin mr-1" />
      </div>
    );
  }

  if (deviceInfo.success === "Disconnected") {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4 flex items-center justify-center gap-2">
            <OctagonAlert className="w-8 h-8 text-red-500" />
            <span className="mb-1">Device Not Connected</span>
          </h1>
          <Button variant="outline" onClick={() => window.location.reload()}>
            <RefreshCw className="w-4 h-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <main className="flex flex-col gap-4 p-8">
        <div>
          <h1 className="text-2xl font-bold">Attendance Log Manager</h1>
          <p className="text-sm text-muted-foreground">
            Extract and manage attendance logs
          </p>
        </div>

        <div className="grid grid-cols-4 gap-4 mt-4">
          {deviceInfoMap.map((item, index) => {
            return (
              <StatsCard
                key={index}
                title={item.title}
                value={item.value || "-"}
                icon={item.icon}
              />
            );
          })}
        </div>

        <LogsFilter
          onGetAttendance={handleGetAttendance}
          startDate={startDate}
          endDate={endDate}
          setStartDate={setStartDate}
          setEndDate={setEndDate}
        />

        <div className="border shadow-sm p-4 rounded-md">
          <div className="mb-4 flex justify-between items-center">
            <div>
              <h1 className="text-lg font-bold">Attendance Logs</h1>
              <p className="text-sm text-muted-foreground">
                Showing {attendanceLogs?.data?.length} attendance logs
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleExportLogs}>
                <Download className="w-4 h-4" />
                Export Logs
              </Button>
              <Button
                onClick={() =>
                  handleGetAttendance(
                    new Date().toISOString().split("T")[0],
                    new Date().toISOString().split("T")[0]
                  )
                }
              >
                <Download className="w-4 h-4" />
                Get Today's Logs
              </Button>
            </div>
          </div>
          <DataTable
            data={attendanceLogs?.report?.rows || []}
            columns={attendanceLogs?.report?.columns || []}
            isLoading={isAttendanceLogsLoading}
          />
        </div>
      </main>
    </div>
  );
};

export default HomePage;
