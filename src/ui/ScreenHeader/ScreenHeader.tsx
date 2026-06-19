import type { ReactNode } from 'react'
import styles from './ScreenHeader.module.css'

type Props = {
  title: string
  subtitle?: string
  actions?: ReactNode
}

export function ScreenHeader({ title, subtitle, actions }: Props) {
  const hasActions = Boolean(actions)

  return (
    <header className={[styles.header, hasActions ? styles.headerWithActions : ''].filter(Boolean).join(' ')}>
      <div>
        <h1 className={styles.title}>{title}</h1>
        {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
      </div>
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </header>
  )
}
