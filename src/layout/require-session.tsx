import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/auth'
import { paths } from '@/paths'

/**
 * Обёртка для разделов кабинета.
 * Без сессии отправляет на {@link paths.login}.
 * @see {@link GuestOnly} — обратная проверка для экранов входа
 */
export function RequireSession() {
  const session = useAuth((s) => s.session)
  const status = useAuth((s) => s.status)

  if (status === 'loading') {
    return null
  }

  if (!session) {
    return <Navigate to={paths.login} replace />
  }

  return <Outlet />
}
