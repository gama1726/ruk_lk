import { Navigate } from 'react-router-dom'
import { useCallback, useEffect } from 'react'
import { AttendancePanel } from '@/blocks/attendance-panel'
import { fetchParentAttendance } from '@/attendance'
import { useAppFeatures } from '@/features'
import { ParentDataSection } from '@/layout/parent-locked-section'
import { paths } from '@/paths'

export function ParentAttendance() {
  const fetchAttendance = useCallback(fetchParentAttendance, [])
  const attendanceEnabled = useAppFeatures((s) => s.features?.attendanceEnabled === true)
  const featuresStatus = useAppFeatures((s) => s.status)
  const loadFeatures = useAppFeatures((s) => s.load)

  useEffect(() => {
    if (featuresStatus === 'idle') void loadFeatures()
  }, [featuresStatus, loadFeatures])

  if (featuresStatus !== 'ready') {
    return null
  }

  if (!attendanceEnabled) {
    return <Navigate to={paths.parentHome} replace />
  }

  const subtitle = 'Все посещения университета ребёнком'

  return (
    <ParentDataSection title="Посещаемость">
      <AttendancePanel subtitle={subtitle} fetchAttendance={fetchAttendance} />
    </ParentDataSection>
  )
}
