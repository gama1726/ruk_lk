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
} from '@/mocks/attendance'

export type AttendanceSummaryDto = {
  days: number
  absentDays?: number
  earliest: string | null
  latest: string | null
}

export type StudentAttendanceDto = {
  source: string
  days: AttendanceDay[]
  summary: AttendanceSummaryDto
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

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)

  const monthLabel = new Intl.DateTimeFormat('ru-RU', {
    month: 'long',
    year: 'numeric',
  }).format(monthStart)

  return [
    {
      id: 'week',
      label: 'Текущая неделя',
      from: iso(startOfWeek),
      to: iso(endOfWeek),
    },
    {
      id: 'month',
      label: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
      from: iso(monthStart),
      to: iso(monthEnd),
    },
    {
      id: '30d',
      label: 'Последние 30 дней',
      from: iso(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 29)),
      to: iso(today),
    },
    { id: 'custom', label: 'Свой период', from: '', to: '' },
  ]
}

export {
  formatAttendanceDate,
  formatStayDuration,
  isAttendanceAbsent,
  mockPresets as attendancePeriodPresets,
  mockFilter as filterAttendanceDays,
  mockSummary as attendanceSummaryForRange,
}
