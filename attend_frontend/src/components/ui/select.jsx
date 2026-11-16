import * as React from "react";

import { cn } from "@/lib/utils";

// Native <select> styled to match Input
const Select = React.forwardRef(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "flex h-9 w-full cursor-pointer rounded-lg border border-input bg-card px-3 py-1 text-base shadow-[0_1px_2px_rgb(24_24_27/0.04)] transition-[border-color,box-shadow] hover:border-[#d4d4dc] focus-visible:outline-none focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/12 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
      className
    )}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = "Select";

export { Select };
