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
  section?: LkAdminSection
  /** Только супер-админ (не через секции). */
  superAdminOnly?: boolean
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
    to: paths.adminLkAbsenceReportKazan,
    label: 'Отчёт · Казань',
    title: 'Отчёт отсутствующих · Казань',
    section: 'ABSENCE_REPORT_KAZAN',
    end: true,
  },
  {
    to: paths.adminLkAbsenceReportKrasnodar,
    label: 'Отчёт · Краснодар',
    title: 'Отчёт отсутствующих · Краснодар',
    section: 'ABSENCE_REPORT_KRASNODAR',
    end: true,
  },
  {
    to: paths.adminLkAbsenceReportHead,
    label: 'Отчёт · Голова',
    title: 'Отчёт отсутствующих · Голова',
    section: 'ABSENCE_REPORT_HEAD',
    end: true,
  },
  {
    to: paths.adminLkAbsenceReportSettings,
    label: 'Настройки отчёта',
    title: 'Настройки автоотчёта отсутствующих',
    superAdminOnly: true,
    end: true,
  },
  {
    to: paths.adminLkEvents,
    label: 'Мероприятия',
    title: 'Мероприятия',
    section: 'EVENTS',
  },
  {
    to: paths.adminLkApiLoad,
    label: 'Нагрузка API',
    title: 'Нагрузка API',
    section: 'API_LOAD',
  },
  {
    to: paths.adminLkUsers,
    label: 'Пользователи ЛК',
    title: 'Пользователи ЛК',
    section: 'CABINET_STATS',
  },
  {
    to: paths.adminLkAdmins,
    label: 'Учётки',
    title: 'Учётки админки',
    section: 'ADMINS',
  },
]

function canSeeNav(me: LkAdminMe | undefined, item: NavItem): boolean {
  if (item.superAdminOnly) return Boolean(me?.superAdmin)
  if (!item.section) return false
  return hasLkSection(me, item.section)
}

function pathMatchesNav(pathname: string, item: NavItem): boolean {
  if (item.end) {
    return pathname === item.to
  }
  return pathname === item.to || pathname.startsWith(`${item.to}/`)
}

export function AdminLkLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [me, setMe] = useState<LkAdminMe>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const navItems = useMemo(
    () => allNavItems.filter((item) => canSeeNav(me, item)),
    [me],
  )

  const pageSection =
    navItems.find((item) => pathMatchesNav(location.pathname, item))?.title ?? 'Админ-панель'

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
    const denied = allNavItems.find(
      (item) => pathMatchesNav(location.pathname, item) && !canSeeNav(me, item),
    )
    if (denied) {
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
