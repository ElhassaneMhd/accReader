import React from "react";
import { cn } from "@/lib/utils";

const ErrorMessage = ({ className, children, ...props }) => {
  return (
    <div
      className={cn(
        "text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

ErrorMessage.displayName = "ErrorMessage";

export { ErrorMessage };
