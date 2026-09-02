import { Navigate, Outlet } from 'react-router-dom'
import { useParentAuth } from '@/parent-auth'
import { paths } from '@/paths'

/** Экраны входа родителя — только без сессии PARENT. */
export function ParentGuestOnly() {
  const session = useParentAuth((s) => s.session)
  const status = useParentAuth((s) => s.status)

  if (status === 'loading') {
    return null
  }

  if (session) {
    return <Navigate to={paths.parentHome} replace />
  }

  return <Outlet />
}
