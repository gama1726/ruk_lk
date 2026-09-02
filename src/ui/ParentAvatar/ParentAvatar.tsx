import { parentAvatarSrc } from '@/parent-avatar'
import type { ImgHTMLAttributes } from 'react'
import styles from './ParentAvatar.module.css'

type ParentAvatarProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  /** Роль из сессии: «Отец», «Мать» и т.д. */
  relation?: string | null
  /** `lg` — профиль, `sm` — шапка */
  size?: 'sm' | 'lg'
}

const sizeClass = {
  sm: styles.sm,
  lg: styles.lg,
} as const

/** Круглый аватар родителя по роли. */
export function ParentAvatar({
  relation,
  size = 'sm',
  className,
  alt = '',
  ...rest
}: ParentAvatarProps) {
  const frameClass = [styles.frame, sizeClass[size], className].filter(Boolean).join(' ')

  return (
    <span className={frameClass}>
      <img
        src={parentAvatarSrc(relation)}
        alt={alt}
        className={styles.image}
        decoding="async"
        draggable={false}
        {...rest}
      />
    </span>
  )
}
