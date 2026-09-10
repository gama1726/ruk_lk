import { Navigate } from 'react-router-dom'
import { useCallback } from 'react'
import { AttendancePanel } from '@/blocks/attendance-panel'
import { ATTENDANCE_FEATURE_ENABLED } from '@/campus'
import { fetchParentAttendance } from '@/attendance'
import { ParentDataSection } from '@/layout/parent-locked-section'
import { paths } from '@/paths'

export function ParentAttendance() {
  const fetchAttendance = useCallback(fetchParentAttendance, [])

  if (!ATTENDANCE_FEATURE_ENABLED) {
    return <Navigate to={paths.parentHome} replace />
  }

  const subtitle = 'Все посещения университета ребёнком'

  return (
    <ParentDataSection title="Посещаемость">
      <AttendancePanel subtitle={subtitle} fetchAttendance={fetchAttendance} />
    </ParentDataSection>
  )
}
