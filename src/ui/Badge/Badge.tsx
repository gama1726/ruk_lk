import type { HTMLAttributes } from 'react'
import styles from './Badge.module.css'

type BadgeVariant = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

export function Badge({ variant = 'default', className, children, ...props }: BadgeProps) {
  return (
    <span className={[styles.badge, styles[variant], className ?? ''].filter(Boolean).join(' ')} {...props}>
      {children}
    </span>
  )
}
