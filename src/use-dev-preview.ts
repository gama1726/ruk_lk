/**
 * @file Хук: разделы «в разработке» для тестовой зачётки (`app.preview.student-ids`).
 */

import { useEffect } from 'react'
import { useAppFeatures } from '@/features'

export function useDevPreview(): boolean | null {
  const features = useAppFeatures((s) => s.features)
  const status = useAppFeatures((s) => s.status)
  const load = useAppFeatures((s) => s.load)

  useEffect(() => {
    if (status === 'idle') void load(true)
  }, [status, load])

  if (status !== 'ready' || !features) return null
  return features.previewEnabled === true
}
