/**
 * @file Календарь мероприятий — кабинет студента.
 */

import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { EventsCalendar } from '@/blocks/events-calendar'
import { eventCampusLabel, isEventsNavVisible, resolveEventCampus } from '@/campus'
import { paths } from '@/paths'
import { useStudentProfile } from '@/student-profile-store'

export function EventsPage() {
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
