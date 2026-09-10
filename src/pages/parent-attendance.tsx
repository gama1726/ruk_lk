import { Navigate } from 'react-router-dom'
import { useCallback, useEffect, useState } from 'react'
import { AttendancePanel } from '@/blocks/attendance-panel'
import { fetchParentAttendance } from '@/attendance'
import { isAttendanceNavVisible } from '@/campus'
import { useAppFeatures } from '@/features'
import { ParentDataSection } from '@/layout/parent-locked-section'
import { fetchParentProfile } from '@/parent-profile'
import { paths } from '@/paths'

export function ParentAttendance() {
  const fetchAttendance = useCallback(fetchParentAttendance, [])
  const features = useAppFeatures((s) => s.features)
  const featuresStatus = useAppFeatures((s) => s.status)
  const loadFeatures = useAppFeatures((s) => s.load)
  const [campusAllowed, setCampusAllowed] = useState<boolean | null>(null)

  useEffect(() => {
    if (featuresStatus === 'idle') void loadFeatures()
  }, [featuresStatus, loadFeatures])

  useEffect(() => {
    let cancelled = false
    void fetchParentProfile()
      .then((profile) => {
        if (cancelled) return
        setCampusAllowed(isAttendanceNavVisible(profile.student, true))
      })
      .catch(() => {
        if (!cancelled) setCampusAllowed(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const featureEnabled = featuresStatus !== 'ready' || features?.attendanceEnabled === true
  const allowed = featureEnabled && campusAllowed !== false

  if (featuresStatus === 'ready' && !featureEnabled) {
    return <Navigate to={paths.parentHome} replace />
  }
  if (campusAllowed === false) {
    return <Navigate to={paths.parentHome} replace />
  }

  const subtitle = 'Все посещения университета ребёнком'

  return (
    <ParentDataSection title="Посещаемость">
      <AttendancePanel subtitle={subtitle} fetchAttendance={fetchAttendance} enabled={allowed} />
    </ParentDataSection>
  )
}
