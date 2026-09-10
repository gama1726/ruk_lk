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
import { useStudentProfile } from '@/student-profile-store'

export function Attendance() {
  const program = useCurrentProgram()
  const profile = useStudentProfile((s) => s.profile)
  const features = useAppFeatures((s) => s.features)
  const featuresStatus = useAppFeatures((s) => s.status)
  const loadFeatures = useAppFeatures((s) => s.load)

  useEffect(() => {
    if (featuresStatus === 'idle') void loadFeatures()
  }, [featuresStatus, loadFeatures])

  // Пока флаг не загружен — не редиректим и не отдаём пустой экран.
  const featureEnabled = featuresStatus !== 'ready' || features?.attendanceEnabled === true
  const attendanceAllowed = isAttendanceNavVisible(profile, featureEnabled)

  if (featuresStatus === 'ready' && !attendanceAllowed) {
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
