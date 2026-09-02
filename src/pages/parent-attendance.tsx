import { useCallback } from 'react'
import { AttendancePanel } from '@/blocks/attendance-panel'
import { fetchParentAttendance } from '@/attendance'
import { ParentDataSection } from '@/layout/parent-locked-section'
import { useParentAuth } from '@/parent-auth'

export function ParentAttendance() {
  const session = useParentAuth((s) => s.session)
  const fetchAttendance = useCallback(fetchParentAttendance, [])

  const subtitle = session
    ? `Зачётка ${session.studentId} · проходы на территорию вуза`
    : 'Проходы на территорию вуза'

  return (
    <ParentDataSection title="Посещаемость">
      <AttendancePanel subtitle={subtitle} fetchAttendance={fetchAttendance} />
    </ParentDataSection>
  )
}
