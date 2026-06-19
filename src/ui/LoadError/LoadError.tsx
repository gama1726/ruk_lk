import type { ReactNode } from 'react'
import { Button } from '../Button'
import styles from './LoadError.module.css'

type Props = {
  title?: string
  message?: string
  onRetry?: () => void
  action?: ReactNode
}

export function LoadError({
  title = 'Не удалось загрузить данные',
  message = 'Попробуйте обновить страницу или повторить позже.',
  onRetry,
  action,
}: Props) {
  return (
    <div className={styles.error} role="alert">
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.message}>{message}</p>
      {onRetry ? (
        <Button variant="secondary" onClick={onRetry}>
          Повторить
        </Button>
      ) : null}
      {action}
    </div>
  )
}
