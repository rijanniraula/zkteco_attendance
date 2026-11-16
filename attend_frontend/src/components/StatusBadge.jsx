import React from "react";
import { STATUS_META } from "@/helpers/constants";
import { cn } from "@/lib/utils";

// Pastel status pill. `compact` shows only the code (for the grid); edited days get a pink dot.
const StatusBadge = ({ status, edited, compact, className }) => {
  const meta = STATUS_META[status] || STATUS_META.future;
  if (!meta.code) return null;
  return (
    <span
      className={cn(
        "relative inline-flex items-center justify-center font-medium",
        compact
          ? "h-6 w-7 rounded-md text-[11px]"
          : "rounded-full px-2.5 py-0.5 text-[11px]",
        meta.className,
        className
      )}
      title={edited ? `${meta.label} (edited by admin)` : meta.label}
    >
      {compact ? meta.code : meta.label}
      {edited && (
        <span
          className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-highlight ring-2 ring-card"
          aria-hidden="true"
        />
      )}
    </span>
  );
};

export const StatusLegend = () => (
  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
    {["present", "late", "absent", "leave", "holiday", "pending"].map((s) => (
      <span key={s} className="flex items-center gap-1.5">
        <StatusBadge status={s} compact /> {STATUS_META[s].label}
      </span>
    ))}
    <span className="flex items-center gap-1.5">
      <span className="size-2 rounded-full bg-highlight" /> Edited by admin
    </span>
  </div>
);

export default StatusBadge;
