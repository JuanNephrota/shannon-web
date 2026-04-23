import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Field-terminal button set.
 * - `default`: solid signal — for decisive, primary actions only.
 * - `outline`: hairline frame on ink — the workhorse secondary.
 * - `ghost`: no frame, shows on hover — for tertiary / toolbar actions.
 * - `destructive`: rust/vermillion, confirmed-destructive posture.
 * - `stamp`: tiny all-caps mono stamp for contextual inline actions.
 */
const buttonVariants = cva(
  [
    "relative inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "font-mono text-[11px] font-medium uppercase tracking-[0.18em]",
    "transition-[background,border-color,color,transform] duration-150 ease-out",
    "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-signal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-50",
    "disabled:pointer-events-none disabled:opacity-40 disabled:saturate-0",
    "[&_svg]:pointer-events-none [&_svg]:h-3.5 [&_svg]:w-3.5 [&_svg]:shrink-0",
    "select-none",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "bg-signal-400 text-ink-0 border border-signal-400",
          "hover:bg-signal-300 hover:border-signal-300",
          "active:translate-y-[1px] active:bg-signal-500",
          "shadow-[0_0_0_1px_rgba(245,132,26,0.4),0_8px_24px_-12px_rgba(245,132,26,0.7)]",
        ].join(" "),
        outline: [
          "bg-transparent border border-ink-400 text-paper-0",
          "hover:border-signal-400 hover:text-signal-300 hover:bg-signal-400/5",
          "active:translate-y-[1px]",
        ].join(" "),
        secondary: [
          "bg-ink-200 border border-ink-400 text-paper-0",
          "hover:bg-ink-300 hover:border-ink-500",
        ].join(" "),
        destructive: [
          "bg-transparent border border-alert-500/50 text-alert-400",
          "hover:bg-alert-500/15 hover:border-alert-500 hover:text-alert-400",
          "active:translate-y-[1px]",
        ].join(" "),
        ghost: [
          "bg-transparent text-paper-0/80 border border-transparent",
          "hover:text-signal-300 hover:bg-signal-400/5",
        ].join(" "),
        link: [
          "text-signal-300 underline-offset-4 hover:underline p-0 h-auto",
          "uppercase tracking-[0.18em]",
        ].join(" "),
        stamp: [
          "bg-transparent border border-dashed border-ink-500 text-paper-400",
          "hover:border-signal-400 hover:text-signal-300",
          "text-[10px] tracking-[0.24em]",
        ].join(" "),
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-7 px-3 text-[10px]",
        lg: "h-11 px-6 text-xs tracking-[0.22em]",
        icon: "h-9 w-9 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
