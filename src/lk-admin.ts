/**
 * @file Клиент API административной панели ЛК.
 */

import { apiGet, apiPost, apiPut } from '@/apiClient'
import type { StudentAttendanceDto } from '@/attendance'

export type LkAdminSection = 'ATTENDANCE' | 'ADMINS'

export type LkAdminMe = {
  id: string
  username: string
  fullName: string
  superAdmin: boolean
  sections: LkAdminSection[]
}

export type LkAdminUser = {
  id: string
  username: string
  fullName: string
  active: boolean
  superAdmin: boolean
  sections: LkAdminSection[]
  createdAt: string
}

export type LkAdminCreateBody = {
  fullName: string
  username: string
  password: string
  sections: LkAdminSection[]
}

export type LkAdminUpdateBody = {
  fullName?: string
  password?: string
  active?: boolean
  sections?: LkAdminSection[]
}

export type AdminAttendanceDto = StudentAttendanceDto & {
  studentId: string
  fullName: string
  group: string
  faculty: string
  branch: string
  branchCampus: boolean
}

export const LK_ADMIN_SECTION_LABELS: Record<LkAdminSection, string> = {
  ATTENDANCE: 'Посещаемость',
  ADMINS: 'Учётки админки',
}

export async function lkAdminLogin(username: string, password: string): Promise<LkAdminMe> {
  return apiPost<LkAdminMe>('/api/admin/lk/auth/login', { username, password })
}

export async function lkAdminLogout(): Promise<void> {
  await apiPost<{ ok: string }>('/api/admin/lk/auth/logout', {})
}

export async function lkAdminMe(): Promise<LkAdminMe> {
  return apiGet<LkAdminMe>('/api/admin/lk/auth/me')
}

export async function listLkAdmins(): Promise<LkAdminUser[]> {
  return apiGet<LkAdminUser[]>('/api/admin/lk/admins')
}

export async function createLkAdmin(body: LkAdminCreateBody): Promise<LkAdminUser> {
  return apiPost<LkAdminUser>('/api/admin/lk/admins', body)
}

export async function updateLkAdmin(id: string, body: LkAdminUpdateBody): Promise<LkAdminUser> {
  return apiPut<LkAdminUser>(`/api/admin/lk/admins/${id}`, body)
}

export async function fetchLkAdminAttendance(
  studentId: string,
  from: string,
  to: string,
): Promise<AdminAttendanceDto> {
  const params = new URLSearchParams({ studentId, from, to })
  return apiGet<AdminAttendanceDto>(`/api/admin/lk/attendance?${params}`)
}

export function hasLkSection(me: LkAdminMe | undefined, section: LkAdminSection): boolean {
  if (!me) return false
  if (me.superAdmin) return true
  return me.sections.includes(section)
}

export function firstAllowedLkPath(me: LkAdminMe): string {
  if (hasLkSection(me, 'ATTENDANCE')) return '/admin/lk/attendance'
  if (hasLkSection(me, 'ADMINS')) return '/admin/lk/admins'
  return '/admin/lk'
}
