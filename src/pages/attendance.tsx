/**
 * @file Выгрузка проходов в вуз: API (Perco) или мок.
 */

import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { AttendancePanel } from '@/blocks/attendance-panel'
import { isAttendanceNavVisible } from '@/campus'
import { fetchStudentAttendance } from '@/attendance'
import { useAppFeatures } from '@/features'
import { programLabel } from '@/mocks/format'
import { paths } from '@/paths'
import { useCurrentProgram } from '@/study'

export function Attendance() {
  const program = useCurrentProgram()
  const attendanceEnabled = useAppFeatures((s) => s.features?.attendanceEnabled === true)
  const featuresStatus = useAppFeatures((s) => s.status)
  const loadFeatures = useAppFeatures((s) => s.load)
  const attendanceAllowed = isAttendanceNavVisible(null, attendanceEnabled)

  useEffect(() => {
    if (featuresStatus === 'idle') void loadFeatures()
  }, [featuresStatus, loadFeatures])

  if (featuresStatus !== 'ready') {
    return null
  }

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
