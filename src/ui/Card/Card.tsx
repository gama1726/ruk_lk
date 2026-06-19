import type { HTMLAttributes, ReactNode } from 'react'
import styles from './Card.module.css'

type CardPadding = 'none' | 'sm' | 'md' | 'lg'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string
  padding?: CardPadding
  flush?: boolean
  children: ReactNode
}

export function Card({ title, padding = 'md', flush = false, children, className, ...props }: CardProps) {
  const paddingClass = styles[`padding-${padding}`]

  if (title) {
    return (
      <div className={[styles.card, className ?? ''].filter(Boolean).join(' ')} {...props}>
        <div className={styles.header}>
          <h3 className={styles.title}>{title}</h3>
        </div>
        <div className={flush ? styles.bodyFlush : styles.body}>{children}</div>
      </div>
    )
  }

  return (
    <div className={[styles.card, paddingClass, className ?? ''].filter(Boolean).join(' ')} {...props}>
      {children}
    </div>
  )
}
