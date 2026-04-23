import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  status: 'running' | 'completed' | 'failed' | 'pending' | 'unknown';
  size?: 'sm' | 'md';
}

/**
 * Signal dot + stamped label. The "running" dot pulses in signal-amber
 * — it's the heartbeat of the terminal, the one moment of motion the
 * user should feel present at all times.
 */
const statusConfig = {
  running: {
    label: 'RUNNING',
    dot: 'bg-signal-400 animate-signal-pulse',
    frame: 'border-signal-400/60 text-signal-300 bg-signal-400/5',
  },
  completed: {
    label: 'COMPLETE',
    dot: 'bg-go-400',
    frame: 'border-go-500/40 text-go-400 bg-go-500/5',
  },
  failed: {
    label: 'FAILED',
    dot: 'bg-alert-400',
    frame: 'border-alert-500/50 text-alert-400 bg-alert-500/5',
  },
  pending: {
    label: 'QUEUED',
    dot: 'bg-wait-400',
    frame: 'border-wait-500/40 text-wait-400 bg-wait-500/5',
  },
  unknown: {
    label: 'UNKNOWN',
    dot: 'bg-paper-500',
    frame: 'border-ink-400 text-paper-400 bg-transparent',
  },
};

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 border",
        "font-mono font-medium uppercase tracking-[0.22em] leading-none",
        config.frame,
        size === 'sm'
          ? "text-[9px] px-2 py-[3px]"
          : "text-[10px] px-2.5 py-[5px]"
      )}
    >
      <span
        className={cn(
          "inline-block rounded-full",
          size === 'sm' ? "h-1.5 w-1.5" : "h-2 w-2",
          config.dot
        )}
      />
      {config.label}
    </span>
  );
}
