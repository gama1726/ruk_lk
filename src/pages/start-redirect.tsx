/**
 * @file Раздел Start — мост на start.ruc.su при app.start.enabled=true.
 */

import { useEffect } from 'react'
import { useAppFeatures } from '@/features'
import { ComingSoon } from '@/pages/coming-soon'
import { Loader } from '@/ui'

const START_API_REDIRECT = '/api/student/start/redirect'

export function StartRedirect() {
  const features = useAppFeatures((s) => s.features)
  const status = useAppFeatures((s) => s.status)
  const load = useAppFeatures((s) => s.load)

  useEffect(() => {
    if (status === 'idle') void load()
  }, [status, load])

  useEffect(() => {
    if (status !== 'ready') return
    if (features?.startEnabled !== true) return
    window.location.replace(START_API_REDIRECT)
  }, [status, features?.startEnabled])

  if (status !== 'ready') {
    return <Loader />
  }

  if (features?.startEnabled === true) {
    return <Loader />
  }

  return <ComingSoon title="Start" note="Образовательная платформа start.ruc.su" />
}
