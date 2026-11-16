import React from "react";
import { formatDistanceToNow, formatDistanceToNowStrict } from "date-fns";
import { Data, DocumentText, Profile2User, Refresh2 } from "iconsax-reactjs";
import { cn } from "@/lib/utils";
import Figures from "./Figures";

const timeAgo = (iso) => (iso ? `${formatDistanceToNow(new Date(iso))} ago` : "never");
// "2 min ago", "3 h ago", "5 days ago"
const shortAgo = (iso) =>
  `${formatDistanceToNowStrict(new Date(iso))
    .replace(/ seconds?/, " s")
    .replace(/ minutes?/, " min")
    .replace(/ hours?/, " h")} ago`;
const num = (n) => (n == null ? "—" : Number(n).toLocaleString());

// data = /admin/device/info response: { info, status, sync, stored }
const DeviceInfo = ({ data }) => {
  const info = data?.info || {};
  const connected = Boolean(data?.status?.connected && data?.info);
  const capacity = info.logCapacity
    ? Math.round((info.logCounts / info.logCapacity) * 1000) / 10
    : 0;

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(260px,1fr)_3fr]">
      {/* Device identity + live status */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-[0_1px_2px_rgb(24_24_27/0.03)]">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium",
            connected ? "bg-present-bg text-present" : "bg-absent-bg text-absent"
          )}
        >
          <span className="relative flex size-1.5">
            {connected && (
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-present opacity-70" />
            )}
            <span className={cn("relative inline-flex size-1.5 rounded-full", connected ? "bg-present" : "bg-absent")} />
          </span>
          {connected ? "Online" : "Offline"}
        </span>
        <div className="mt-2 text-lg font-semibold">
          {info.deviceName || (connected ? "ZKTeco device" : "Not reachable")}
        </div>
        <div className="mt-0.5 text-xs text-muted-foreground">
          {connected
            ? <>{data.status.ip} · checked {timeAgo(data.status.lastConnectedAt)}</>
            : data?.status?.lastError || "Waiting for the device to come back on the network"}
        </div>
      </div>

      <Figures
        items={[
          { label: "users on device", value: num(info.userCounts), icon: Profile2User, tone: "primary" },
          {
            label: "logs on device",
            value: num(info.logCounts),
            icon: DocumentText,
            tone: "primary",
            note: `${capacity}% full`,
          },
          { label: "stored in app", value: num(data?.stored?.logCount), icon: Data, tone: "primary" },
          {
            label: "last sync",
            value: data?.sync?.lastSyncAt ? shortAgo(data.sync.lastSyncAt) : "—",
            icon: Refresh2,
            tone: data?.sync?.lastError ? "absent" : "primary",
            note: data?.sync?.lastError ? "last attempt failed" : undefined,
          },
        ]}
      />
    </div>
  );
};

export default DeviceInfo;
