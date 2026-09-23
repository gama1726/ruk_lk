/**
 * @file Календарь мероприятий — кабинет студента.
 */

import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { EventsCalendar } from '@/blocks/events-calendar'
import { eventCampusLabel, isEventsNavVisible, resolveEventCampus } from '@/campus'
import { ComingSoon } from '@/pages/coming-soon'
import { paths } from '@/paths'
import { useStudentProfile } from '@/student-profile-store'
import { useDevPreview } from '@/use-dev-preview'
import { Loader } from '@/ui'

function EventsPageContent() {
  const profile = useStudentProfile((s) => s.profile)
  const profileStatus = useStudentProfile((s) => s.status)
  const loadProfile = useStudentProfile((s) => s.load)

  useEffect(() => {
    if (profileStatus === 'idle') void loadProfile()
  }, [profileStatus, loadProfile])

  const allowed = isEventsNavVisible(profile)
  const campus = resolveEventCampus(profile)

  if (profileStatus === 'ready' && profile && !allowed) {
    return <Navigate to={paths.profile} replace />
  }

  const subtitle =
    campus === 'KAZAN'
      ? `Мероприятия · ${eventCampusLabel('KAZAN')}`
      : `Мероприятия · ${eventCampusLabel('HEAD')}`

  return <EventsCalendar subtitle={subtitle} />
}

export function EventsPage() {
  const preview = useDevPreview()
  if (preview === null) return <Loader />
  if (!preview) return <ComingSoon title="Мероприятия" />
  return <EventsPageContent />
}
