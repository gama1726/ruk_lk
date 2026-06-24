import { useEffect, type ReactNode } from 'react'
import { useAuth } from '@/auth'
import styles from './auth-bootstrap.module.css'

type Props = {
  children: ReactNode
}

/**
 * Восстанавливает сессию через `GET /api/auth/me` перед роутингом.
 */
export function AuthBootstrap({ children }: Props) {
  const status = useAuth((s) => s.status)
  const restoreSession = useAuth((s) => s.restoreSession)

  useEffect(() => {
    void restoreSession()
  }, [restoreSession])

  if (status === 'loading') {
    return (
      <div className={styles.screen} role="status" aria-live="polite">
        Загрузка…
      </div>
    )
  }

  return children
}
