/**
 * @file Клиент API административной панели ЛК.
 */

import { apiGet, apiGetBlob, apiPost, apiPut } from '@/apiClient'
import type { StudentAttendanceDto } from '@/attendance'

export type LkAdminSection =
  | 'ATTENDANCE'
  | 'ABSENCE_REPORT_KAZAN'
  | 'ABSENCE_REPORT_KRASNODAR'
  | 'ABSENCE_REPORT_HEAD'
  | 'EVENTS'
  | 'API_LOAD'
  | 'CABINET_STATS'
  | 'ADMINS'

export type AbsenceReportCampus = 'KAZAN' | 'KRASNODAR' | 'HEAD'

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

export type AbsenceReportStageTiming = {
  phase: string
  label: string
  durationMs: number
}

export type AbsenceReport = {
  id: string
  status: 'RUNNING' | 'DONE' | 'FAILED' | 'CANCELLED' | string
  date: string
  group: string
  scheduleRange: string
  rosterSize: number
  absentCount: number
  source: string
  /** MANUAL | AUTO */
  origin?: string
  /** CAMPUS | GROUP */
  scope?: string
  /** Имя группы при scope=GROUP */
  filterGroup?: string
  rows: AbsenceReportRow[]
  warnings: string[]
  error?: string
  progressPhase?: string
  progressLabel?: string
  progressPercent?: number
  progressCurrent?: number
  progressTotal?: number
  /** Полное время сборки, мс */
  buildDurationMs?: number | null
  stageTimings?: AbsenceReportStageTiming[]
}

export type AbsenceReportSummary = {
  id: string
  date: string
  status: string
  /** MANUAL | AUTO */
  origin?: string
  /** CAMPUS | GROUP */
  scope?: string
  filterGroup?: string
  rosterSize: number
  absentCount: number
  createdAt: string
  finishedAt: string
  error: string
  buildDurationMs?: number | null
}

export const LK_ADMIN_SECTION_LABELS: Record<LkAdminSection, string> = {
  ATTENDANCE: 'Посещаемость',
  ABSENCE_REPORT_KAZAN: 'Отчёт · Казань',
  ABSENCE_REPORT_KRASNODAR: 'Отчёт · Краснодар',
  ABSENCE_REPORT_HEAD: 'Отчёт · Голова',
  EVENTS: 'Мероприятия',
  API_LOAD: 'Нагрузка API',
  CABINET_STATS: 'Пользователи ЛК',
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

export async function fetchAbsenceReport(body: {
  date: string
  scope?: 'CAMPUS' | 'GROUP' | string
  group?: string
  campus: AbsenceReportCampus | string
}): Promise<AbsenceReport> {
  return apiPost<AbsenceReport>('/api/admin/lk/absence-report', body)
}

export async function cancelAbsenceReport(id: string): Promise<AbsenceReport> {
  return apiPost<AbsenceReport>(`/api/admin/lk/absence-report/${id}/cancel`, {})
}

export async function getAbsenceReport(id: string): Promise<AbsenceReport> {
  return apiGet<AbsenceReport>(`/api/admin/lk/absence-report/${id}`)
}

export async function listAbsenceReports(campus: AbsenceReportCampus | string): Promise<AbsenceReportSummary[]> {
  const params = new URLSearchParams({ campus })
  return apiGet<AbsenceReportSummary[]>(`/api/admin/lk/absence-reports?${params}`)
}

/** Только супер-админ: отчёты по одной группе. */
export async function listGroupAbsenceReports(
  campus: AbsenceReportCampus | string,
): Promise<AbsenceReportSummary[]> {
  const params = new URLSearchParams({ campus })
  return apiGet<AbsenceReportSummary[]>(`/api/admin/lk/absence-reports/groups?${params}`)
}

export async function downloadAbsenceReportExcel(id: string): Promise<void> {
  const { blob, filename } = await apiGetBlob(`/api/admin/lk/absence-report/${id}/excel`)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename || `absence-report-${id}.xlsx`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
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

export async function sendAbsenceNoticeOne(
  date: string,
  studentId: string,
  fullName: string,
  kind: string,
  absenceRange: string,
): Promise<{ ok: boolean; notified: boolean }> {
  return apiPost<{ ok: boolean; notified: boolean }>('/api/admin/lk/absence-report/notify-one', {
    date,
    studentId,
    fullName,
    kind,
    absenceRange,
  })
}

export type AbsenceReportCampusSettings = {
  campus: AbsenceReportCampus
  label: string
  autoEnabled: boolean
  notifyEnabled: boolean
  flagAutoEnabled: boolean
  flagNotifyEnabled: boolean
  effectiveAuto: boolean
  effectiveNotify: boolean
}

export type AbsenceReportSettings = {
  autoCron: string
  campuses: AbsenceReportCampusSettings[]
}

export type AbsenceReportSettingsUpdate = {
  campuses: Array<{
    campus: AbsenceReportCampus
    autoEnabled?: boolean
    notifyEnabled?: boolean
  }>
}

export function getAbsenceReportSettings(): Promise<AbsenceReportSettings> {
  return apiGet<AbsenceReportSettings>('/api/admin/lk/absence-report/settings')
}

export function updateAbsenceReportSettings(
  body: AbsenceReportSettingsUpdate,
): Promise<AbsenceReportSettings> {
  return apiPut<AbsenceReportSettings>('/api/admin/lk/absence-report/settings', body)
}

export function hasLkSection(me: LkAdminMe | undefined, section: LkAdminSection): boolean {
  if (!me) return false
  if (me.superAdmin) return true
  return me.sections.includes(section)
}

export function firstAllowedLkPath(me: LkAdminMe): string {
  if (hasLkSection(me, 'ATTENDANCE')) return '/admin/lk/attendance'
  if (hasLkSection(me, 'ABSENCE_REPORT_KRASNODAR')) return '/admin/lk/absence-report/krasnodar'
  if (hasLkSection(me, 'ABSENCE_REPORT_KAZAN')) return '/admin/lk/absence-report/kazan'
  if (hasLkSection(me, 'ABSENCE_REPORT_HEAD')) return '/admin/lk/absence-report/head'
  if (hasLkSection(me, 'EVENTS')) return '/admin/lk/events'
  if (hasLkSection(me, 'API_LOAD')) return '/admin/lk/load'
  if (hasLkSection(me, 'CABINET_STATS')) return '/admin/lk/users'
  if (hasLkSection(me, 'ADMINS')) return '/admin/lk/admins'
  return '/admin/lk'
}
