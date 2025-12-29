import React, { useMemo } from "react";
import StatsCard from "./StatsCard";
import {
  CheckCircle,
  XCircle,
  Users,
  Logs,
  Calculator,
  Activity,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";

const DeviceInfo = ({ deviceInfo, deviceSyncAt }) => {
  const deviceInfoMap = useMemo(() => {
    const connectionStatus =
      deviceInfo.success === "Connected" ? "Connected" : "Disconnected";
    const ConnectionStatusIcon = () => {
      return (
        <span
          className={cn(
            connectionStatus === "Connected"
              ? "text-green-500 bg-green-100"
              : "text-red-500 bg-red-100 ",
            "w-10 h-10 rounded-lg flex items-center justify-center"
          )}
        >
          {connectionStatus === "Connected" ? (
            <Activity className="w-5 h-5" />
          ) : (
            <XCircle className="w-5 h-5" />
          )}
        </span>
      );
    };

    const connectionStatusClassName =
      connectionStatus === "Connected"
        ? "bg-green-50 border-green-200 "
        : "bg-red-50 border-red-200 ";

    const logCapacityPercentage =
      (deviceInfo.logCounts / deviceInfo.logCapacity) * 100 || 69;

    return [
      {
        title: "Connection Status",
        value: connectionStatus,
        subText: `Last synced at ${deviceSyncAt}`,
        icon: <ConnectionStatusIcon />,
        className: connectionStatusClassName,
      },
      {
        title: "User Counts",
        value: deviceInfo.userCounts,
        subText: "Number of users in the device",
        icon: <Users className="w-5 h-5" />,
        className: "bg-blue-50 border-blue-200 text-blue-500",
        iconClassName: "text-blue-500 bg-blue-100 ",
      },
      {
        title: "Log Count",
        value: <>{deviceInfo.logCounts}</>,
        subText: (
          <>
            <div className="w-full h-1.5 bg-muted rounded-full">
              <div
                className="h-full bg-blue-700 rounded-full"
                style={{ width: `${logCapacityPercentage}%` }}
              />
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {logCapacityPercentage}% Capacity
            </div>
          </>
        ),
        icon: <ClipboardList className="w-5 h-5" />,
        iconClassName: "text-blue-700 bg-blue-100",
      },

      {
        title: "Device Name",
        value: deviceInfo.deviceName,
        subText: "Name of the device",
        icon: <Calculator className="w-5 h-5" />,
        iconClassName: "text-blue-700 bg-blue-100",
      },
    ];
  }, [deviceInfo]);

  return (
    <div className="grid grid-cols-4 gap-4 mt-4">
      {deviceInfoMap.map((item, index) => {
        return (
          <StatsCard
            key={index}
            title={item.title}
            value={item.value || "-"}
            subText={item.subText}
            icon={item.icon}
            className={item.className}
            iconClassName={item.iconClassName}
          />
        );
      })}
    </div>
  );
};

export default DeviceInfo;
