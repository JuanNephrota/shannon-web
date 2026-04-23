import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Badge — a stamped metadata chip. Small, all-caps, wide-tracked mono.
 * Variants map to run-state semantics (signal/go/alert/wait) rather
 * than generic brand roles.
 */
const badgeVariants = cva(
  [
    "inline-flex items-center gap-1.5",
    "px-2 py-[3px] border",
    "font-mono text-[10px] font-medium uppercase",
    "tracking-[0.18em] leading-none",
    "transition-colors",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "border-signal-400/60 text-signal-300 bg-signal-400/10",
        secondary:
          "border-ink-400 text-paper-400 bg-ink-200",
        destructive:
          "border-alert-500/60 text-alert-400 bg-alert-500/10",
        outline:
          "border-ink-400 text-paper-0/80 bg-transparent",
        success:
          "border-go-500/50 text-go-400 bg-go-500/10",
        warning:
          "border-wait-500/50 text-wait-400 bg-wait-500/10",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
