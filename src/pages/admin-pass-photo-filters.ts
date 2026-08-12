import type { PassPhotoAdminItem, PassPhotoStatus } from '@/pass-photo'

export type QueueFilter = 'all' | 'pending' | 'syncing'

export type HistoryFilter = 'all' | 'PERCO_SYNCED' | 'REJECTED' | 'PERCO_FAILED'

export function matchesPassPhotoSearch(item: PassPhotoAdminItem, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  const haystack = [item.studentFullName, item.zachetka, item.studentId]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return haystack.includes(q)
}

export function filterQueueItems(
  items: PassPhotoAdminItem[],
  search: string,
  queueFilter: QueueFilter,
): PassPhotoAdminItem[] {
  return items.filter((item) => {
    if (!matchesPassPhotoSearch(item, search)) return false
    if (queueFilter === 'pending') return item.status === 'PENDING'
    if (queueFilter === 'syncing') return item.status === 'PERCO_SYNCING'
    return item.status === 'PENDING' || item.status === 'PERCO_SYNCING'
  })
}

export function filterHistoryItems(
  items: PassPhotoAdminItem[],
  search: string,
  historyFilter: HistoryFilter,
): PassPhotoAdminItem[] {
  return items.filter((item) => {
    if (!matchesPassPhotoSearch(item, search)) return false
    if (historyFilter === 'all') return true
    return item.status === historyFilter
  })
}

export function countByStatus(items: PassPhotoAdminItem[], status: PassPhotoStatus): number {
  return items.filter((i) => i.status === status).length
}
