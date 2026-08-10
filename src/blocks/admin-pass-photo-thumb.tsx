import { useEffect, useState } from 'react'
import { getApiBaseUrl } from '@/apiClient'
import { adminRoleHeaders, type EducationTrack } from '@/pass-photo'

type Props = {
  id: string
  role: EducationTrack
  alt: string
  className?: string
}

export function AdminPassPhotoThumb({ id, role, alt, className }: Props) {
  const [src, setSrc] = useState<string | null>(null)

  useEffect(() => {
    let objectUrl: string | null = null
    let cancelled = false

    void (async () => {
      const response = await fetch(`${getApiBaseUrl()}/api/admin/pass-photos/${id}/image`, {
        credentials: 'include',
        headers: adminRoleHeaders(role),
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
  }, [id, role])

  if (!src) {
    return <div className={className}>Загрузка…</div>
  }

  return <img className={className} src={src} alt={alt} />
}
