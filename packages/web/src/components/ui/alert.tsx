import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Alert — a framed notice stamped with a leading rule on the left edge.
 * Carries a small-caps STATUS marker and maintains field-terminal feel.
 */
const alertVariants = cva(
  [
    "relative w-full px-4 py-3 pl-5 text-[13px]",
    "font-mono border",
    "[&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:h-4 [&>svg]:w-4",
    "[&>svg~*]:pl-7",
    "before:absolute before:inset-y-0 before:left-0 before:w-[3px]",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "bg-ink-100/60 text-paper-0 border-ink-400 before:bg-ink-400",
        destructive:
          "bg-alert-500/[0.06] text-alert-400 border-alert-500/50 before:bg-alert-500 [&>svg]:text-alert-400",
        warning:
          "bg-wait-500/[0.06] text-wait-400 border-wait-500/50 before:bg-wait-500 [&>svg]:text-wait-400",
        signal:
          "bg-signal-400/[0.06] text-signal-300 border-signal-400/50 before:bg-signal-400 [&>svg]:text-signal-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
))
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn(
      "mb-1 font-mono text-[10px] font-medium uppercase tracking-[0.22em] leading-none",
      className
    )}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-[13px] leading-relaxed [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }
