/**
 * @file Клиент API редактора календаря мероприятий.
 */

import { apiDelete, apiGet, apiPost, apiPut } from '@/apiClient'
import type { CampusEventDto } from '@/events'

export type EventsAdminMe = {
  username: string
}

export type CampusEventWrite = {
  /** HEAD | KAZAN */
  campus: string
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

export async function listAdminEvents(campus?: string): Promise<CampusEventDto[]> {
  const q = campus ? `?campus=${encodeURIComponent(campus)}` : ''
  return apiGet<CampusEventDto[]>(`/api/admin/events${q}`)
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

export type CabinetStatsDay = {
  date: string
  students: number
  parents: number
  total: number
}

export type CabinetUserListItem = {
  id: string
  role: string
  studentId: string
  displayName: string
  firstLoginAt: string
  lastLoginAt: string
  lastSeenAt: string
}

export type CabinetStats = {
  totalRegistered: number
  onlineNow: number
  newInRange: number
  onlineWindowMinutes: number
  from: string
  to: string
  series: CabinetStatsDay[]
  recentUsers: CabinetUserListItem[]
}

export async function fetchEventsAdminStats(from: string, to: string): Promise<CabinetStats> {
  const params = new URLSearchParams({ from, to })
  return apiGet<CabinetStats>(`/api/admin/events/stats?${params}`)
}

export type ApiLoadEndpoint = {
  method: string
  path: string
  inFlight: number
  requestsPerMinute: number
  completedTotal: number
  errors4xx: number
  errors5xx: number
  avgDurationMs: number
  minDurationMs: number
  maxDurationMs: number
  avgInFlightAllTime: number
  minInFlightAllTime: number
  maxInFlightAllTime: number
  avgRpmAllTime: number
  minRpmAllTime: number
  maxRpmAllTime: number
}

export type OutboundError = {
  atMs: number
  service: string
  operation: string
  status: number
  detail: string
}

export type ApiLoadSnapshot = {
  collectedAtMs: number
  windowSeconds: number
  totalInFlight: number
  totalRequestsPerMinute: number
  processStartedAtMs: number
  endpoints: ApiLoadEndpoint[]
  outboundInFlight: number
  outboundRequestsPerMinute: number
  outbound: ApiLoadEndpoint[]
  recentOutboundErrors: OutboundError[]
}

export async function fetchEventsAdminLoad(): Promise<ApiLoadSnapshot> {
  return apiGet<ApiLoadSnapshot>('/api/admin/events/load')
}
