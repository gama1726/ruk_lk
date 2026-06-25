import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/auth'
import { paths } from '@/paths'

/**
 * Только для гостя: login и verify-code.
 * Если сессия уже есть — редирект на {@link paths.home}.
 */
export function GuestOnly() {
  const session = useAuth((s) => s.session)
  const status = useAuth((s) => s.status)

  if (status === 'loading') {
    return null
  }

  if (session) {
    return <Navigate to={paths.profile} replace />
  }

  return <Outlet />
}
