import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Field input — bare, mono, hairline bottom + box border.
 * On focus the border shifts to signal-amber and a subtle glow appears,
 * mimicking an illuminated control-panel field.
 */
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full bg-ink-50/60 px-3 py-2",
          "border border-ink-400 text-paper-0",
          "font-mono text-[13px] tracking-tight",
          "transition-colors",
          "placeholder:text-paper-500/70 placeholder:uppercase placeholder:tracking-[0.14em] placeholder:text-[11px]",
          "focus-visible:outline-none focus-visible:border-signal-400 focus-visible:ring-1 focus-visible:ring-signal-400/40 focus-visible:bg-ink-50",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-paper-0",
          "caret-signal-400",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
