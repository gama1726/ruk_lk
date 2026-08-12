import type { PassPhotoAdminItem, PassPhotoStatus } from '@/pass-photo'

/** Единый фильтр по статусу заявки. */
export type StatusFilter =
  | 'all'
  | 'pending'
  | 'syncing'
  | 'history'
  | 'PERCO_SYNCED'
  | 'REJECTED'
  | 'PERCO_FAILED'

export type StatusFilterOption = {
  id: StatusFilter
  label: string
  count: number
}

export function matchesPassPhotoSearch(item: PassPhotoAdminItem, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  const haystack = [item.studentFullName, item.zachetka, item.studentId]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return haystack.includes(q)
}

export function showQueueSection(filter: StatusFilter): boolean {
  return filter === 'all' || filter === 'pending' || filter === 'syncing'
}

export function showHistorySection(filter: StatusFilter): boolean {
  return (
    filter === 'all' ||
    filter === 'history' ||
    filter === 'PERCO_SYNCED' ||
    filter === 'REJECTED' ||
    filter === 'PERCO_FAILED'
  )
}

export function filterQueueItems(
  items: PassPhotoAdminItem[],
  search: string,
  statusFilter: StatusFilter,
): PassPhotoAdminItem[] {
  if (!showQueueSection(statusFilter)) return []

  return items.filter((item) => {
    if (!matchesPassPhotoSearch(item, search)) return false
    if (statusFilter === 'pending') return item.status === 'PENDING'
    if (statusFilter === 'syncing') return item.status === 'PERCO_SYNCING'
    return item.status === 'PENDING' || item.status === 'PERCO_SYNCING'
  })
}

export function filterHistoryItems(
  items: PassPhotoAdminItem[],
  search: string,
  statusFilter: StatusFilter,
): PassPhotoAdminItem[] {
  if (!showHistorySection(statusFilter)) return []

  return items.filter((item) => {
    if (!matchesPassPhotoSearch(item, search)) return false
    if (statusFilter === 'all' || statusFilter === 'history') return true
    return item.status === statusFilter
  })
}

export function countByStatus(items: PassPhotoAdminItem[], status: PassPhotoStatus): number {
  return items.filter((i) => i.status === status).length
}

export function buildStatusFilterOptions(totals: {
  pending: number
  syncing: number
  history: number
  synced: number
  rejected: number
  failed: number
}): StatusFilterOption[] {
  return [
    { id: 'all', label: 'Все', count: totals.pending + totals.syncing + totals.history },
    { id: 'pending', label: 'На проверке', count: totals.pending },
    { id: 'syncing', label: 'В Perco', count: totals.syncing },
    { id: 'history', label: 'Обработанные', count: totals.history },
    { id: 'PERCO_SYNCED', label: 'Принято', count: totals.synced },
    { id: 'REJECTED', label: 'Отклонено', count: totals.rejected },
    { id: 'PERCO_FAILED', label: 'Ошибка Perco', count: totals.failed },
  ]
}
