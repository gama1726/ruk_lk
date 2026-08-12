import { useEffect, useRef } from 'react'
import styles from './Lightbox.module.css'

export type LightboxProps = {
  open: boolean
  src: string | null
  alt: string
  caption?: string
  onClose: () => void
}

export function Lightbox({ open, src, alt, caption, onClose }: LightboxProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open || !src) return null

  return (
    <div
      ref={overlayRef}
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose()
      }}
    >
      <button type="button" className={styles.close} onClick={onClose} aria-label="Закрыть">
        <svg width="18" height="18" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>

      <figure className={styles.figure}>
        <img className={styles.image} src={src} alt={alt} />
        {caption ? <figcaption className={styles.caption}>{caption}</figcaption> : null}
      </figure>
    </div>
  )
}
