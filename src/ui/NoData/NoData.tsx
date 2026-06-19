import type { ReactNode } from 'react'
import styles from './NoData.module.css'

type Props = {
  title: string
  description?: string
  action?: ReactNode
}

export function NoData({ title, description, action }: Props) {
  return (
    <div className={styles.empty}>
      <svg className={styles.icon} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M3 9h18" stroke="currentColor" strokeWidth="1.5" />
      </svg>
      <h3 className={styles.title}>{title}</h3>
      {description ? <p className={styles.description}>{description}</p> : null}
      {action ? <div className={styles.action}>{action}</div> : null}
    </div>
  )
}
