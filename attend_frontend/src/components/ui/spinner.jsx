import React from "react";
import { cn } from "@/lib/utils";

// Small circular loading indicator (sized by font/size classes, inherits text colour)
const Spinner = ({ className }) => (
  <span
    role="status"
    aria-label="Loading"
    className={cn(
      "inline-block size-4 shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent",
      className
    )}
  />
);

export { Spinner };
