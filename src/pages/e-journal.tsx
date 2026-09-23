/**
 * @file Электронный журнал — мост на pulse.ruc.su.
 * При app.pulse.enabled — всем; при false — полноценный вход только тестовым зачёткам, остальным ComingSoon.
 */

import { useEffect } from 'react'
import { useAppFeatures } from '@/features'
import { ComingSoon } from '@/pages/coming-soon'
import { Loader } from '@/ui'

const PULSE_API_REDIRECT = '/api/student/pulse/redirect'

export function EJournal() {
  const features = useAppFeatures((s) => s.features)
  const status = useAppFeatures((s) => s.status)
  const load = useAppFeatures((s) => s.load)

  const usePulse = features?.pulseEnabled === true || features?.previewEnabled === true

  useEffect(() => {
    if (status === 'idle') void load(true)
  }, [status, load])

  useEffect(() => {
    if (status !== 'ready') return
    if (!usePulse) return
    window.location.replace(PULSE_API_REDIRECT)
  }, [status, usePulse])

  if (status !== 'ready' || !features) {
    return <Loader />
  }

  if (usePulse) {
    return <Loader />
  }

  return <ComingSoon title="Электронный журнал" note="Электронный журнал pulse.ruc.su" />
}
