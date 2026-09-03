/**
 * @file Клиент API календаря мероприятий (кабинеты).
 */

import { apiGet, isApiConfigured } from '@/apiClient'

export type CampusEventDto = {
  id: string
  /** HEAD | KAZAN */
  campus: string
  title: string
  description: string
  startDate: string
  endDate: string
  published: boolean
  createdAt: string
  updatedAt: string
}

export function isEventsApiEnabled(): boolean {
  return isApiConfigured()
}

export async function fetchMonthEvents(year: number, month: number): Promise<CampusEventDto[]> {
  return apiGet<CampusEventDto[]>(`/api/events?year=${year}&month=${month}`)
}
