import { useEffect, type ReactNode } from 'react'
import { useAuth } from '@/auth'
import { useParentAuth } from '@/parent-auth'
import styles from './auth-bootstrap.module.css'

type Props = {
  children: ReactNode
}

/**
 * Восстанавливает сессию студента и родителя перед роутингом.
 */
export function AuthBootstrap({ children }: Props) {
  const studentStatus = useAuth((s) => s.status)
  const parentStatus = useParentAuth((s) => s.status)
  const restoreStudent = useAuth((s) => s.restoreSession)
  const restoreParent = useParentAuth((s) => s.restoreSession)

  useEffect(() => {
    void Promise.all([restoreStudent(), restoreParent()])
  }, [restoreStudent, restoreParent])

  if (studentStatus === 'loading' || parentStatus === 'loading') {
    return (
      <div className={styles.screen} role="status" aria-live="polite">
        Загрузка…
      </div>
    )
  }

  return children
}
