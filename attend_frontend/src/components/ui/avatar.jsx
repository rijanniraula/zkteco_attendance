import React from "react";
import { cn } from "@/lib/utils";

const initials = (name = "") =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("") || "?";

// Round initials badge
const Avatar = ({ name, className }) => (
  <span
    className={cn(
      "grid size-8 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-semibold text-primary",
      className
    )}
  >
    {initials(name)}
  </span>
);

export { Avatar };
