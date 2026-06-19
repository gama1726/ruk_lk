import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/auth'
import { paths } from '@/paths'

export function RequireSession() {
  const session = useAuth((s) => s.session)

  if (!session) {
    return <Navigate to={paths.login} replace />
  }

  return <Outlet />
}
