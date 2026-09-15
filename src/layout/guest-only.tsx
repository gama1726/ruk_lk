/**
 * @file Гостевые экраны входа: если уже есть сессия — увести дальше.
 */

import { useEffect } from 'react'
import { Navigate, Outlet, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/auth'
import { useParentAuth } from '@/parent-auth'
import { goAfterLogin, rememberLoginReturn } from '@/login-return'
import { paths } from '@/paths'

/**
 * Только для гостя: login и verify-code.
 * Если сессия студента или родителя уже есть — редирект в кабинет (или на next).
 */
export function GuestOnly() {
  const session = useAuth((s) => s.session)
  const status = useAuth((s) => s.status)
  const parentSession = useParentAuth((s) => s.session)
  const parentStatus = useParentAuth((s) => s.status)
  const [params] = useSearchParams()

  useEffect(() => {
    rememberLoginReturn(params.get('next'))
  }, [params])

  useEffect(() => {
    if (status === 'loading' || parentStatus === 'loading') return
    if (!session) return
    goAfterLogin(() => undefined, paths.profile)
  }, [session, status, parentStatus])

  if (status === 'loading' || parentStatus === 'loading') {
    return null
  }

  if (session) {
    return null
  }

  if (parentSession) {
    return <Navigate to={paths.parentHome} replace />
  }

  return <Outlet />
}
