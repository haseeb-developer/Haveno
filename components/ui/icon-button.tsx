import * as React from "react";
import { cn } from "@/lib/utils";

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
}

/**
 * Small square icon-only button used for compact inline actions (reveal,
 * copy, favorite, etc). Centralizes hover/focus-visible treatment so every
 * icon action across the app is consistently keyboard-accessible instead
 * of each usage re-implementing its own button styling.
 */
export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, active, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150",
        "hover:bg-accent hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-card",
        "disabled:pointer-events-none disabled:opacity-40",
        active && "text-vault-gold hover:text-vault-gold",
        className
      )}
      {...props}
    />
  )
);
IconButton.displayName = "IconButton";
