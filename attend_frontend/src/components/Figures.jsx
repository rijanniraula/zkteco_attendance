import React from "react";
import { cn } from "@/lib/utils";

const TONES = {
  default: { icon: "bg-secondary text-foreground/70", value: "text-foreground" },
  primary: { icon: "bg-primary-soft text-primary", value: "text-foreground" },
  present: { icon: "bg-present-bg/70 text-present", value: "text-foreground" },
  late: { icon: "bg-late-bg/70 text-late", value: "text-foreground" },
  absent: { icon: "bg-absent-bg/70 text-absent", value: "text-foreground" },
  leave: { icon: "bg-leave-bg/70 text-leave", value: "text-foreground" },
  holiday: { icon: "bg-holiday-bg text-holiday", value: "text-foreground" },
};

/**
 * Row of stats in one rounded strip: tinted icon, bold value, label, optional note.
 * items = [{ label, value, note, tone, icon }]
 */
const Figures = ({ items, className }) => (
  <div
    className={cn(
      "grid rounded-xl border border-border bg-card shadow-[0_1px_2px_rgb(24_24_27/0.03)]",
      "grid-cols-2 md:[grid-template-columns:repeat(var(--cols),minmax(0,1fr))]",
      className
    )}
    style={{ "--cols": items.length }}
  >
    {items.map((item, i) => {
      const tone = TONES[item.tone || "default"];
      const Icon = item.icon;
      return (
        <div
          key={item.label}
          className={cn(
            "flex min-w-0 items-center gap-3 px-4 py-3.5",
            i % 2 === 1 && "border-l border-border",
            i >= 2 && "border-t border-border md:border-t-0",
            i > 0 && "md:border-l",
            items.length % 2 === 1 && i === items.length - 1 && "col-span-2 md:col-span-1"
          )}
        >
          {Icon && (
            <span className={cn("grid size-9 shrink-0 place-items-center rounded-lg", tone.icon)}>
              <Icon size={18} variant="Bulk" />
            </span>
          )}
          <div className="min-w-0">
            <div className={cn("truncate text-xl font-semibold leading-tight tabular-nums tracking-tight", tone.value)}>
              {item.value ?? "—"}
            </div>
            <div className="truncate text-xs text-muted-foreground">
              {item.label}
              {item.note && <span className="text-muted-foreground/70"> · {item.note}</span>}
            </div>
          </div>
        </div>
      );
    })}
  </div>
);

export default Figures;
