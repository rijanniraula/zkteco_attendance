import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { makeApiRequest } from "@/helpers/api";
import { ENDPOINTS } from "@/helpers/constants";
import { dummyDeviceInfo, dummyAttendanceLogs } from "@/lib/dummyData";
import StatsCard from "@/components/StatsCard";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Users, Logs, Calculator } from "lucide-react";

const HomePage = () => {
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [deviceInfo, setDeviceInfo] = useState({
    success: "Disconnected",
    userCounts: 0,
    logCounts: 0,
    logCapacity: 0,
    deviceName: "",
  });

  const handleGetDeviceInfo = async () => {
    setDeviceInfo({ ...dummyDeviceInfo, success: "Disconnected" });
    try {
      const response = await makeApiRequest(ENDPOINTS.GET_DEVICE_INFO);
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

  const handleGetAttendance = async () => {
    try {
      const response = await makeApiRequest(ENDPOINTS.GET_ATTENDANCE);
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

  useEffect(() => {
    handleGetDeviceInfo();
  }, []);
  console.log(deviceInfo);
  return (
    <div>
      <main className="flex flex-col gap-4 p-8">
        <div>
          <h1 className="text-2xl font-bold">Attendance Log Manager</h1>
          <p>Extract and manage attendance logs</p>
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
      </main>
    </div>
  );
};

export default HomePage;
