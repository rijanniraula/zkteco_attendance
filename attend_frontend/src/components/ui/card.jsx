import * as React from "react";

import { cn } from "@/lib/utils";

// A sheet of the register: flat paper with a hairline edge
const Card = React.forwardRef(({ className, ...props }, ref) => (
  <section
    ref={ref}
    className={cn("rounded-xl border border-border bg-card p-5 space-y-4 shadow-[0_1px_2px_rgb(24_24_27/0.03)]", className)}
    {...props}
  />
));
Card.displayName = "Card";

// Icon + title, optional muted description, actions on the right
const CardHeader = ({ icon, title, description, children, className }) => {
  const Icon = icon;
  return (
  <div className={cn("flex flex-wrap items-start justify-between gap-3", className)}>
    <div className="flex items-start gap-2.5">
      {Icon && <Icon size={18} className="mt-0.5 shrink-0 text-foreground/70" />}
      <div className="space-y-0.5">
        <h2 className="text-[15px] font-semibold leading-tight">{title}</h2>
        {description && <p className="text-[13px] text-muted-foreground">{description}</p>}
      </div>
    </div>
    {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
  </div>
  );
};

export { Card, CardHeader };
