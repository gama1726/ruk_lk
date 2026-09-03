/**
 * @file Клиент API редактора календаря мероприятий.
 */

import { apiDelete, apiGet, apiPost, apiPut } from '@/apiClient'
import type { CampusEventDto } from '@/events'

export type EventsAdminMe = {
  username: string
}

export type CampusEventWrite = {
  title: string
  description?: string
  startDate: string
  endDate: string
  published: boolean
}

export async function eventsAdminLogin(username: string, password: string): Promise<EventsAdminMe> {
  return apiPost<EventsAdminMe>('/api/admin/events/auth/login', { username, password })
}

export async function eventsAdminLogout(): Promise<void> {
  await apiPost<{ ok: string }>('/api/admin/events/auth/logout', {})
}

export async function eventsAdminMe(): Promise<EventsAdminMe> {
  return apiGet<EventsAdminMe>('/api/admin/events/auth/me')
}

export async function listAdminEvents(): Promise<CampusEventDto[]> {
  return apiGet<CampusEventDto[]>('/api/admin/events')
}

export async function createAdminEvent(body: CampusEventWrite): Promise<CampusEventDto> {
  return apiPost<CampusEventDto>('/api/admin/events', body)
}

export async function updateAdminEvent(id: string, body: CampusEventWrite): Promise<CampusEventDto> {
  return apiPut<CampusEventDto>(`/api/admin/events/${id}`, body)
}

export async function deleteAdminEvent(id: string): Promise<void> {
  await apiDelete<{ ok: string }>(`/api/admin/events/${id}`)
}
