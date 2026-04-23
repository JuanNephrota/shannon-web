import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-ink-200/80 animate-pulse",
        "before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-paper-0/5 before:to-transparent",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
