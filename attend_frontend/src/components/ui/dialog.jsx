import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { CloseCircle } from "iconsax-reactjs";

import { cn } from "@/lib/utils";

const Dialog = DialogPrimitive.Root;
const DialogClose = DialogPrimitive.Close;

const DialogContent = React.forwardRef(({ className, children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[#18181b]/30 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in-0" />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-1/2 top-1/2 z-50 grid w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 gap-5 rounded-2xl border border-border bg-card p-6 shadow-[0_24px_60px_-20px_rgb(24_24_27/0.3)] max-h-[90vh] overflow-y-auto data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 cursor-pointer rounded-full text-muted-foreground hover:text-foreground">
        <CloseCircle size={20} />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
DialogContent.displayName = "DialogContent";

const DialogHeader = ({ title, description }) => (
  <div className="space-y-1 pr-8">
    <DialogPrimitive.Title className="text-lg font-semibold leading-tight">{title}</DialogPrimitive.Title>
    <DialogPrimitive.Description className={cn("text-sm text-muted-foreground", !description && "sr-only")}>
      {description || title}
    </DialogPrimitive.Description>
  </div>
);

const DialogFooter = ({ className, ...props }) => (
  <div className={cn("flex justify-end gap-2", className)} {...props} />
);

export { Dialog, DialogClose, DialogContent, DialogHeader, DialogFooter };
