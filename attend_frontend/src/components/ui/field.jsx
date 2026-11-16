import React from "react";
import { Label } from "./label";
import { cn } from "@/lib/utils";

// Label + control + optional hint/error, stacked
const Field = ({ label, htmlFor, hint, error, className, children }) => (
  <div className={cn("space-y-1.5", className)}>
    {label && <Label htmlFor={htmlFor}>{label}</Label>}
    {children}
    {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
    {error && <p className="text-xs text-absent">{error}</p>}
  </div>
);

const FormError = ({ message }) =>
  message ? (
    <div role="alert" className="rounded-lg bg-absent-bg/60 px-3 py-2 text-[13px] text-absent">
      {message}
    </div>
  ) : null;

const FormSuccess = ({ message }) =>
  message ? (
    <div role="status" className="rounded-lg bg-present-bg/60 px-3 py-2 text-[13px] text-present">
      {message}
    </div>
  ) : null;

export { Field, FormError, FormSuccess };
