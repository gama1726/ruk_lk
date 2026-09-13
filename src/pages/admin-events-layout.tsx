/**
 * @file Layout админки мероприятий: шапка, навигация, проверка сессии.
 */

import { useCallback, useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { ApiError } from '@/apiClient'
import { eventsAdminLogout, eventsAdminMe } from '@/events-admin'
import { paths } from '@/paths'
import { Loader, LoadError } from '@/ui'
import { AdminEventsShell } from '@/pages/admin-events-shell'
import styles from './admin-events.module.css'

const navItems = [
  { to: paths.adminEvents, label: 'Мероприятия', end: true, title: 'Мероприятия' },
  { to: paths.adminEventsLoad, label: 'Нагрузка API', end: false, title: 'Нагрузка API' },
  { to: paths.adminEventsUsers, label: 'Пользователи ЛК', end: false, title: 'Пользователи ЛК' },
  { to: paths.adminEventsAttendance, label: 'Посещаемость', end: false, title: 'Посещаемость' },
] as const

export function AdminEventsLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState<string>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const pageSection =
    navItems.find((item) =>
      item.end ? location.pathname === item.to : location.pathname.startsWith(item.to),
    )?.title ?? 'Админка'

  const loadMe = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const me = await eventsAdminMe()
      setUsername(me.username)
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        navigate(paths.adminEventsLogin, { replace: true })
        return
      }
      setError(err instanceof ApiError ? err.message : 'Не удалось проверить сессию')
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    void loadMe()
  }, [loadMe])

  const onLogout = async () => {
    try {
      await eventsAdminLogout()
    } catch {
      /* ignore */
    }
    navigate(paths.adminEventsLogin, { replace: true })
  }

  if (loading && !username) {
    return (
      <AdminEventsShell pageSection="Админка">
        <Loader />
      </AdminEventsShell>
    )
  }

  if (error && !username) {
    return (
      <AdminEventsShell pageSection="Админка">
        <LoadError message={error} onRetry={() => void loadMe()} />
      </AdminEventsShell>
    )
  }

  return (
    <AdminEventsShell pageSection={pageSection} username={username} onLogout={() => void onLogout()}>
      <nav className={styles.adminNav} aria-label="Разделы редактора">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `${styles.adminNavLink} ${isActive ? styles.adminNavLinkActive : ''}`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </AdminEventsShell>
  )
}
