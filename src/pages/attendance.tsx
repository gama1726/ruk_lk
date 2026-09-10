/**
 * @file Выгрузка проходов в вуз: API (Perco) или мок.
 */

import { Navigate } from 'react-router-dom'
import { AttendancePanel } from '@/blocks/attendance-panel'
import { isAttendanceNavVisible } from '@/campus'
import { fetchStudentAttendance } from '@/attendance'
import { programLabel } from '@/mocks/format'
import { paths } from '@/paths'
import { useCurrentProgram } from '@/study'

export function Attendance() {
  const program = useCurrentProgram()
  const attendanceAllowed = isAttendanceNavVisible(null)

  if (!attendanceAllowed) {
    return <Navigate to={paths.education} replace />
  }

  return (
    <AttendancePanel
      subtitle={`${programLabel(program)} · проходы на территорию вуза`}
      fetchAttendance={fetchStudentAttendance}
      enabled={attendanceAllowed}
    />
  )
}
