/**
 * @file Электронный журнал — мост на pulse.ruc.su при app.pulse.enabled=true.
 */

import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAppFeatures } from '@/features'
import { ComingSoon } from '@/pages/coming-soon'
import { paths } from '@/paths'
import { Loader } from '@/ui'

const PULSE_API_REDIRECT = '/api/student/pulse/redirect'

export function EJournal() {
  const features = useAppFeatures((s) => s.features)
  const status = useAppFeatures((s) => s.status)
  const load = useAppFeatures((s) => s.load)

  useEffect(() => {
    if (status === 'idle') void load(true)
  }, [status, load])

  useEffect(() => {
    if (status !== 'ready') return
    if (features?.pulseEnabled !== true) return
    window.location.replace(PULSE_API_REDIRECT)
  }, [status, features?.pulseEnabled])

  if (status !== 'ready' || !features) {
    return <Loader />
  }

  if (features.pulseEnabled === true) {
    return <Loader />
  }

  // Мост выкл.: раздел только для тестовых зачёток — ComingSoon; остальным — на обучение.
  if (features.previewEnabled !== true) {
    return <Navigate to={paths.education} replace />
  }

  return <ComingSoon title="Электронный журнал" note="Электронный журнал pulse.ruc.su" />
}
