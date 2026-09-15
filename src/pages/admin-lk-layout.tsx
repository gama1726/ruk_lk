/**
 * @file Layout админ-панели ЛК: сессия, навигация по разделам с учётом прав.
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { ApiError } from '@/apiClient'
import {
  firstAllowedLkPath,
  hasLkSection,
  lkAdminLogout,
  lkAdminMe,
  type LkAdminMe,
  type LkAdminSection,
} from '@/lk-admin'
import { paths } from '@/paths'
import { Loader, LoadError } from '@/ui'
import { AdminLkShell } from '@/pages/admin-lk-shell'
import styles from './admin-events.module.css'

type NavItem = {
  to: string
  label: string
  title: string
  section: LkAdminSection
  end?: boolean
}

const allNavItems: NavItem[] = [
  {
    to: paths.adminLkAttendance,
    label: 'Посещаемость',
    title: 'Посещаемость',
    section: 'ATTENDANCE',
  },
  {
    to: paths.adminLkAdmins,
    label: 'Учётки',
    title: 'Учётки админки',
    section: 'ADMINS',
  },
]

export function AdminLkLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [me, setMe] = useState<LkAdminMe>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const navItems = useMemo(
    () => allNavItems.filter((item) => hasLkSection(me, item.section)),
    [me],
  )

  const pageSection =
    navItems.find((item) =>
      item.end ? location.pathname === item.to : location.pathname.startsWith(item.to),
    )?.title ?? 'Админ-панель'

  const loadMe = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const next = await lkAdminMe()
      setMe(next)
      if (location.pathname === paths.adminLk) {
        navigate(firstAllowedLkPath(next), { replace: true })
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        navigate(paths.adminLkLogin, { replace: true })
        return
      }
      setError(err instanceof ApiError ? err.message : 'Не удалось проверить сессию')
    } finally {
      setLoading(false)
    }
  }, [navigate, location.pathname])

  useEffect(() => {
    void loadMe()
  }, [loadMe])

  useEffect(() => {
    if (!me) return
    const onAttendance = location.pathname.startsWith(paths.adminLkAttendance)
    const onAdmins = location.pathname.startsWith(paths.adminLkAdmins)
    if (onAttendance && !hasLkSection(me, 'ATTENDANCE')) {
      navigate(firstAllowedLkPath(me), { replace: true })
    } else if (onAdmins && !hasLkSection(me, 'ADMINS')) {
      navigate(firstAllowedLkPath(me), { replace: true })
    }
  }, [me, location.pathname, navigate])

  const onLogout = async () => {
    try {
      await lkAdminLogout()
    } catch {
      /* ignore */
    }
    navigate(paths.adminLkLogin, { replace: true })
  }

  if (loading && !me) {
    return (
      <AdminLkShell pageSection="Админ-панель">
        <Loader />
      </AdminLkShell>
    )
  }

  if (error && !me) {
    return (
      <AdminLkShell pageSection="Админ-панель">
        <LoadError message={error} onRetry={() => void loadMe()} />
      </AdminLkShell>
    )
  }

  return (
    <AdminLkShell
      pageSection={pageSection}
      username={me?.fullName || me?.username}
      onLogout={() => void onLogout()}
    >
      {navItems.length > 0 ? (
        <nav className={styles.adminNav} aria-label="Разделы админ-панели">
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
      ) : (
        <p className={styles.error}>Нет доступных разделов. Обратитесь к супер-администратору.</p>
      )}
      <Outlet context={{ me }} />
    </AdminLkShell>
  )
}
