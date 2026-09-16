/**
 * @file Клиент API административной панели ЛК.
 */

import { apiGet, apiPost, apiPut } from '@/apiClient'
import type { StudentAttendanceDto } from '@/attendance'

export type LkAdminSection = 'ATTENDANCE' | 'ABSENCE_REPORT' | 'ADMINS'

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

export type AbsenceReportRow = {
  date: string
  group: string
  studentId: string
  fullName: string
  phone: string
  scheduleRange: string
  absenceRange: string
  parentNotified: boolean
  kind: string
}

export type AbsenceReport = {
  date: string
  group: string
  scheduleRange: string
  rosterSize: number
  absentCount: number
  source: string
  rows: AbsenceReportRow[]
  warnings: string[]
}

export const LK_ADMIN_SECTION_LABELS: Record<LkAdminSection, string> = {
  ATTENDANCE: 'Посещаемость',
  ABSENCE_REPORT: 'Отчёт отсутствующих',
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

export async function fetchAbsenceReport(body: { date: string }): Promise<AbsenceReport> {
  return apiPost<AbsenceReport>('/api/admin/lk/absence-report', body)
}

export async function setAbsenceParentNotice(
  date: string,
  studentId: string,
  notified: boolean,
): Promise<void> {
  await apiPut<{ ok: boolean }>('/api/admin/lk/absence-report/parent-notice', {
    date,
    studentId,
    notified,
  })
}

export function hasLkSection(me: LkAdminMe | undefined, section: LkAdminSection): boolean {
  if (!me) return false
  if (me.superAdmin) return true
  return me.sections.includes(section)
}

export function firstAllowedLkPath(me: LkAdminMe): string {
  if (hasLkSection(me, 'ATTENDANCE')) return '/admin/lk/attendance'
  if (hasLkSection(me, 'ABSENCE_REPORT')) return '/admin/lk/absence-report'
  if (hasLkSection(me, 'ADMINS')) return '/admin/lk/admins'
  return '/admin/lk'
}
