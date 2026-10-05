/**
 * @file Календарь мероприятий — кабинет родителя (кампус ребёнка: Голова / Казань).
 */

import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { EventsCalendar } from '@/blocks/events-calendar'
import { eventCampusLabel, isEventsNavVisible, resolveEventCampus } from '@/campus'
import { ComingSoon } from '@/pages/coming-soon'
import { paths } from '@/paths'
import { fetchParentProfile } from '@/parent-profile'
import { useDevPreview } from '@/use-dev-preview'
import { Loader } from '@/ui'

function ParentEventsContent() {
  const [campusProfile, setCampusProfile] = useState<{
    faculty?: string
    department?: string
    branch?: string
    group?: string
  } | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    void fetchParentProfile()
      .then((profile) => {
        if (cancelled) return
        setCampusProfile(profile.student)
        setReady(true)
      })
      .catch(() => {
        if (!cancelled) {
          setCampusProfile(null)
          setReady(true)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (!ready) return <Loader />

  if (campusProfile && !isEventsNavVisible(campusProfile)) {
    return <Navigate to={paths.parentHome} replace />
  }

  const campus = resolveEventCampus(campusProfile)
  const subtitle =
    campus === 'KAZAN'
      ? `Мероприятия · ${eventCampusLabel('KAZAN')}`
      : `Мероприятия · ${eventCampusLabel('HEAD')}`

  return <EventsCalendar subtitle={subtitle} />
}

export function ParentEvents() {
  const preview = useDevPreview()
  if (preview === null) return <Loader />
  if (!preview) return <ComingSoon title="Мероприятия" />
  return <ParentEventsContent />
}
