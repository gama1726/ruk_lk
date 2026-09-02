import { useCallback } from 'react'
import { AttendancePanel } from '@/blocks/attendance-panel'
import { fetchParentAttendance } from '@/attendance'
import { ParentDataSection } from '@/layout/parent-locked-section'

export function ParentAttendance() {
  const fetchAttendance = useCallback(fetchParentAttendance, [])

  const subtitle = 'Все посещения университета ребёнком'

  return (
    <ParentDataSection title="Посещаемость">
      <AttendancePanel subtitle={subtitle} fetchAttendance={fetchAttendance} />
    </ParentDataSection>
  )
}
