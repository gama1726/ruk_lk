import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/auth'
import { useParentAuth } from '@/parent-auth'
import { paths } from '@/paths'

/**
 * Только для гостя: login и verify-code.
 * Если сессия студента или родителя уже есть — редирект в кабинет.
 */
export function GuestOnly() {
  const session = useAuth((s) => s.session)
  const status = useAuth((s) => s.status)
  const parentSession = useParentAuth((s) => s.session)
  const parentStatus = useParentAuth((s) => s.status)

  if (status === 'loading' || parentStatus === 'loading') {
    return null
  }

  if (session) {
    return <Navigate to={paths.profile} replace />
  }

  if (parentSession) {
    return <Navigate to={paths.parentHome} replace />
  }

  return <Outlet />
}
