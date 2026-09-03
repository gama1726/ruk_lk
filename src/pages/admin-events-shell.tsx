/**
 * @file Оболочка админки календаря мероприятий.
 */

import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import logo from '@/assets/ruk-logo.png'
import { paths } from '@/paths'
import { usePageTitle } from '@/use-page-title'
import styles from './admin-events.module.css'

type Props = {
  pageSection: string
  children: ReactNode
  username?: string
  onLogout?: () => void
}

export function AdminEventsShell({ pageSection, children, username, onLogout }: Props) {
  usePageTitle(`${pageSection} — Календарь мероприятий — РУК`)

  return (
    <div className={styles.shell}>
      <header className={styles.topBar}>
        <div className={styles.topBarInner}>
          <Link to={paths.adminEvents} className={styles.brand}>
            <img src={logo} alt="РУК" className={styles.logo} />
            <div className={styles.brandText}>
              <span className={styles.brandTitle}>Календарь мероприятий</span>
              <span className={styles.brandSub}>Редактор</span>
            </div>
          </Link>
          <div className={styles.topActions}>
            {username ? <span className={styles.userBadge}>{username}</span> : null}
            {onLogout ? (
              <button type="button" className={styles.logoutBtn} onClick={onLogout}>
                Выйти
              </button>
            ) : null}
          </div>
        </div>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  )
}
