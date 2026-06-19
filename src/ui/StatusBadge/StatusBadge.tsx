import { Badge, type BadgeProps } from '../Badge'

const STATUS_VARIANTS: Record<string, BadgeProps['variant']> = {
  active: 'success',
  success: 'success',
  completed: 'success',
  ready: 'success',
  present: 'success',
  paid: 'success',
  approved: 'success',
  excellent: 'success',
  good: 'info',
  satisfactory: 'warning',
  warning: 'warning',
  pending: 'warning',
  processing: 'info',
  draft: 'default',
  sent: 'info',
  scheduled: 'default',
  remote: 'info',
  rescheduled: 'warning',
  cancelled: 'danger',
  failed: 'danger',
  rejected: 'danger',
  absent: 'danger',
  debt: 'danger',
  overdue: 'danger',
  not_passed: 'danger',
  not_graded: 'default',
  planned: 'secondary',
  archived: 'default',
}

export interface StatusBadgeProps {
  status: string
  label: string
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const variant = STATUS_VARIANTS[status] ?? 'default'
  return <Badge variant={variant}>{label}</Badge>
}
