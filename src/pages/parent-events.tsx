/**
 * @file Календарь мероприятий — кабинет родителя.
 */

import { EventsCalendar } from '@/blocks/events-calendar'
import { ComingSoon } from '@/pages/coming-soon'
import { useDevPreview } from '@/use-dev-preview'
import { Loader } from '@/ui'

export function ParentEvents() {
  const preview = useDevPreview()
  if (preview === null) return <Loader />
  if (!preview) return <ComingSoon title="Мероприятия" />
  return <EventsCalendar subtitle="Мероприятия университета" />
}
