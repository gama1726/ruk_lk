/**
 * @file Выгрузка проходов в вуз: API (Perco) или мок.
 */

import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { AttendancePanel } from '@/blocks/attendance-panel'
import { isAttendanceNavVisible } from '@/campus'
import { fetchStudentAttendance } from '@/attendance'
import { programLabel } from '@/mocks/format'
import { paths } from '@/paths'
import { useStudentProfile } from '@/student-profile-store'
import { useCurrentProgram } from '@/study'

export function Attendance() {
  const program = useCurrentProgram()
  const profile = useStudentProfile((s) => s.profile)
  const profileStatus = useStudentProfile((s) => s.status)
  const loadProfile = useStudentProfile((s) => s.load)

  useEffect(() => {
    if (profileStatus === 'idle') void loadProfile()
  }, [profileStatus, loadProfile])

  const attendanceAllowed = isAttendanceNavVisible(profile)

  if (profileStatus === 'ready' && profile && !attendanceAllowed) {
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
