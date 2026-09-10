import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/auth'
import { useParentAuth } from '@/parent-auth'
import { paths } from '@/paths'

/** Экраны входа родителя — только без сессии PARENT и STUDENT. */
export function ParentGuestOnly() {
  const session = useParentAuth((s) => s.session)
  const status = useParentAuth((s) => s.status)
  const studentSession = useAuth((s) => s.session)
  const studentStatus = useAuth((s) => s.status)

  if (status === 'loading' || studentStatus === 'loading') {
    return null
  }

  if (session) {
    return <Navigate to={paths.parentHome} replace />
  }

  if (studentSession) {
    return <Navigate to={paths.profile} replace />
  }

  return <Outlet />
}
