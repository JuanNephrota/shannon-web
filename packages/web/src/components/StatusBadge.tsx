import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  status: 'running' | 'completed' | 'failed' | 'pending' | 'unknown';
  size?: 'sm' | 'md';
}

const statusConfig = {
  running: {
    label: 'Running',
    className: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100',
    showPulse: true,
  },
  completed: {
    label: 'Completed',
    className: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-100',
    showPulse: false,
  },
  failed: {
    label: 'Failed',
    className: 'bg-red-100 text-red-800 border-red-200 hover:bg-red-100',
    showPulse: false,
  },
  pending: {
    label: 'Pending',
    className: 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100',
    showPulse: false,
  },
  unknown: {
    label: 'Unknown',
    className: 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100',
    showPulse: false,
  },
};

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 rounded-full",
        config.className,
        size === 'sm' && "text-xs px-2 py-0.5"
      )}
    >
      {config.showPulse && (
        <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
      )}
      {config.label}
    </Badge>
  );
}
