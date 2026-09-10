/**
 * @file Посещаемость (проходы СКУД) с backend / Perco.
 */

import { apiGet, isApiConfigured } from '@/apiClient'
import type { AttendanceDay } from '@/mocks/attendance-types'
import {
  attendancePeriodPresets as mockPresets,
  attendanceSummaryForRange as mockSummary,
  filterAttendanceDays as mockFilter,
  formatAttendanceDate,
  formatStayDuration,
  isAttendanceAbsent,
  lessonStatusLabel,
} from '@/mocks/attendance'

export type AttendanceSummaryDto = {
  days: number
  absentDays?: number
  lateLessons?: number
  unconfirmedLessons?: number
  earliest: string | null
  latest: string | null
}

export type StudentAttendanceDto = {
  source: string
  days: AttendanceDay[]
  summary: AttendanceSummaryDto
}

/** Максимальный диапазон дат посещаемости (включительно по разнице календарных дней). */
export const ATTENDANCE_MAX_RANGE_DAYS = 14

export function isAttendanceRangeTooLong(from: string, to: string): boolean {
  if (!from || !to) return false
  const start = new Date(`${from}T00:00:00`)
  const end = new Date(`${to}T00:00:00`)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false
  const begin = start <= end ? start : end
  const finish = start <= end ? end : start
  const diffDays = Math.round((finish.getTime() - begin.getTime()) / 86_400_000)
  return diffDays > ATTENDANCE_MAX_RANGE_DAYS
}

export function isAttendanceApiEnabled(): boolean {
  return isApiConfigured()
}

export async function fetchStudentAttendance(
  from: string,
  to: string,
): Promise<StudentAttendanceDto> {
  const params = new URLSearchParams({ from, to })
  return apiGet<StudentAttendanceDto>(`/api/student/attendance?${params}`)
}

export async function fetchParentAttendance(
  from: string,
  to: string,
): Promise<StudentAttendanceDto> {
  const params = new URLSearchParams({ from, to })
  return apiGet<StudentAttendanceDto>(`/api/parent/attendance?${params}`)
}

/** Динамические пресеты относительно сегодня */
export function buildAttendancePeriodPresets(today = new Date()) {
  const iso = (d: Date) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  const startOfWeek = new Date(today)
  const dow = (startOfWeek.getDay() + 6) % 7
  startOfWeek.setDate(startOfWeek.getDate() - dow)

  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)

  return [
    {
      id: 'week',
      label: 'Текущая неделя',
      from: iso(startOfWeek),
      to: iso(endOfWeek),
    },
    {
      id: '7d',
      label: 'Последние 7 дней',
      from: iso(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6)),
      to: iso(today),
    },
    { id: 'custom', label: 'Свой период (до 14 дней)', from: '', to: '' },
  ]
}

export {
  formatAttendanceDate,
  formatStayDuration,
  isAttendanceAbsent,
  lessonStatusLabel,
  mockPresets as attendancePeriodPresets,
  mockFilter as filterAttendanceDays,
  mockSummary as attendanceSummaryForRange,
}
