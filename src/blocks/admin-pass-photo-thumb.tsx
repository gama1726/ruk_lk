import { useEffect, useState } from 'react'
import { getApiBaseUrl } from '@/apiClient'
import { adminRoleHeaders, type EducationTrack } from '@/pass-photo'
import styles from '@/pages/admin-pass-photos.module.css'

type Props = {
  id: string
  role: EducationTrack
  alt: string
  className?: string
  onOpen?: (src: string) => void
}

export function AdminPassPhotoThumb({ id, role, alt, className, onOpen }: Props) {
  const [src, setSrc] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let objectUrl: string | null = null
    let cancelled = false
    setSrc(null)
    setFailed(false)

    void (async () => {
      const response = await fetch(`${getApiBaseUrl()}/api/admin/pass-photos/${id}/image`, {
        credentials: 'include',
        headers: adminRoleHeaders(role),
      })
      if (cancelled) return
      if (!response.ok) {
        setFailed(true)
        return
      }
      const blob = await response.blob()
      objectUrl = URL.createObjectURL(blob)
      if (!cancelled) setSrc(objectUrl)
    })()

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [id, role])

  if (failed) {
    return <div className={styles.thumbLoading}>Не удалось загрузить фото</div>
  }

  if (!src) {
    return <div className={styles.thumbLoading}>Загрузка фото…</div>
  }

  const image = <img className={className} src={src} alt={alt} />

  if (onOpen) {
    return (
      <button
        type="button"
        className={styles.thumbButton}
        onClick={() => onOpen(src)}
        aria-label={`Открыть фото: ${alt}`}
      >
        {image}
      </button>
    )
  }

  return image
}
