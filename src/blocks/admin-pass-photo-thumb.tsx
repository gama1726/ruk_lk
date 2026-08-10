import { useEffect, useState } from 'react'
import { getApiBaseUrl } from '@/apiClient'

type Props = {
  id: string
  alt: string
  className?: string
}

export function AdminPassPhotoThumb({ id, alt, className }: Props) {
  const [src, setSrc] = useState<string | null>(null)

  useEffect(() => {
    let objectUrl: string | null = null
    let cancelled = false

    void (async () => {
      const response = await fetch(`${getApiBaseUrl()}/api/admin/pass-photos/${id}/image`, {
        credentials: 'include',
      })
      if (!response.ok || cancelled) return
      const blob = await response.blob()
      objectUrl = URL.createObjectURL(blob)
      if (!cancelled) setSrc(objectUrl)
    })()

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [id])

  if (!src) {
    return <div className={className}>Загрузка…</div>
  }

  return <img className={className} src={src} alt={alt} />
}
