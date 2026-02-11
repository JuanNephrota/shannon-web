interface StatusBadgeProps {
  status: 'running' | 'completed' | 'failed' | 'pending' | 'unknown';
  size?: 'sm' | 'md';
}

const statusStyles = {
  running: 'bg-blue-100 text-blue-800 border-blue-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  failed: 'bg-red-100 text-red-800 border-red-200',
  pending: 'bg-gray-100 text-gray-600 border-gray-200',
  unknown: 'bg-gray-100 text-gray-600 border-gray-200',
};

const statusLabels = {
  running: 'Running',
  completed: 'Completed',
  failed: 'Failed',
  pending: 'Pending',
  unknown: 'Unknown',
};

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${statusStyles[status]} ${sizeClasses}`}
    >
      {status === 'running' && (
        <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
      )}
      {statusLabels[status]}
    </span>
  );
}
