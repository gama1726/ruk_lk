import type { ReactNode } from 'react'
import styles from './SectionTitle.module.css'

export interface SectionTitleProps {
  children: ReactNode
  action?: ReactNode
}

export function SectionTitle({ children, action }: SectionTitleProps) {
  if (action) {
    return (
      <div className={styles.withAction}>
        <h2 className={styles.title}>{children}</h2>
        {action}
      </div>
    )
  }

  return <h2 className={styles.title}>{children}</h2>
}
