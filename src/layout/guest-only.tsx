import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/auth'
import { paths } from '@/paths'

/**
 * Только для гостя: login и verify-code.
 * Если сессия уже есть — редирект на {@link paths.home}.
 */
export function GuestOnly() {
  const session = useAuth((s) => s.session)

  if (session) {
    return <Navigate to={paths.home} replace />
  }

  return <Outlet />
}
