import { isFemaleGender, studentAvatarSrc } from '@/student-avatar'
import type { ImgHTMLAttributes } from 'react'
import styles from './StudentAvatar.module.css'

type StudentAvatarProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  gender?: string | null
  /** `lg` — профиль, `sm` — шапка */
  size?: 'sm' | 'lg'
}

const sizeClass = {
  sm: styles.sm,
  lg: styles.lg,
} as const

/** Круглый аватар студента: кот РУК, вариант по полу. */
export function StudentAvatar({
  gender,
  size = 'sm',
  className,
  alt = '',
  ...rest
}: StudentAvatarProps) {
  const frameClass = [styles.frame, sizeClass[size], className].filter(Boolean).join(' ')
  const imageClass = isFemaleGender(gender) ? styles.imageFemale : styles.imageMale

  return (
    <span className={frameClass}>
      <img
        src={studentAvatarSrc(gender)}
        alt={alt}
        className={imageClass}
        decoding="async"
        draggable={false}
        {...rest}
      />
    </span>
  )
}
