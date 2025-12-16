import React, { useEffect, useMemo, useState } from "react";
import { makeApiRequest } from "@/helpers/api";
import { ENDPOINTS } from "@/helpers/constants";
import { dummyDeviceInfo, dummyAttendanceLogs } from "@/lib/dummyData";
import StatsCard from "@/components/StatsCard";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  XCircle,
  Users,
  Logs,
  Calculator,
  Download,
} from "lucide-react";
import LogsFilter from "@/components/LogsFilter";
import { DataTable } from "@/components/common/DataTable";
import { getAttendanceLogsColumns } from "@/lib/datasheetConstants";
import { Button } from "@/components/ui/button";

const HomePage = () => {
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [deviceInfo, setDeviceInfo] = useState({
    success: "Disconnected",
    userCounts: 0,
    logCounts: 0,
    logCapacity: 0,
    deviceName: "",
  });

  const deviceInfoMap = useMemo(() => {
    return [
      {
        title: "Status",
        value: (
          <Badge variant={deviceInfo.success ? "success" : "destructive"}>
            {deviceInfo.success ? "Connected" : "Disconnected"}
          </Badge>
        ),
        icon: deviceInfo.success ? CheckCircle : XCircle,
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
    setDeviceInfo({ ...dummyDeviceInfo, success: "Disconnected" });
    try {
      const response = await makeApiRequest({
        endpoint: ENDPOINTS.GET_DEVICE_INFO,
      });
      if (response.success) {
        setDeviceInfo({
          ...response,
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
    }
  };

  //get attendance logs
  const handleGetAttendance = async (startDate, endDate) => {
    setAttendanceLogs(dummyAttendanceLogs);
    try {
      const response = await makeApiRequest({
        endpoint: ENDPOINTS.GET_ATTENDANCE,
        method: "POST",
        requestBody: { startDate, endDate },
      });
      if (response.success) {
        // setAttendanceLogs(response);
        setAttendanceLogs(dummyAttendanceLogs);
      } else {
        console.error("Failed to get attendance logs");
      }
    } catch (error) {
      console.error("Error getting attendance logs", error);
    }
  };

  useEffect(() => {
    handleGetDeviceInfo();
  }, []);

  console.log(attendanceLogs);
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

        <LogsFilter onGetAttendance={handleGetAttendance} />

        <div className="border shadow-sm p-4 rounded-md">
          <div className="mb-4 flex justify-between items-center">
            <div>
              <h1 className="text-lg font-bold">Attendance Logs</h1>
              <p className="text-sm text-muted-foreground">
                Showing {attendanceLogs?.data?.length} attendance logs
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline">
                <Download className="w-4 h-4" />
                Export Logs
              </Button>
              <Button>
                <Download className="w-4 h-4" />
                Get Today's Logs
              </Button>
            </div>
          </div>
          <DataTable
            data={attendanceLogs?.data || []}
            columns={getAttendanceLogsColumns() || []}
          />
        </div>
      </main>
    </div>
  );
};

export default HomePage;
