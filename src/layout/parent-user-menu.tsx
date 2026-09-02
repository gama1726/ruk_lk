/**
 * @file Выпадающее меню родителя: зачётка ребёнка и выход.
 */

import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useParentAuth } from '@/parent-auth'
import { paths } from '@/paths'
import { StudentAvatar } from '@/ui/StudentAvatar'
import styles from './user-menu.module.css'

function shortName(full: string) {
  const parts = full.split(' ')
  if (parts.length < 2) return full
  return `${parts[0]} ${parts[1][0]}.`
}

function ChevronIcon() {
  return (
    <svg className={styles.chevron} viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
      <path fill="currentColor" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.25a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08z" />
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg className={styles.itemIcon} viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
      <path
        fill="currentColor"
        d="M3 4.75A2.75 2.75 0 0 1 5.75 2h4.5A2.75 2.75 0 0 1 13 4.75v.5h-1.5v-.5c0-.69-.56-1.25-1.25-1.25h-4.5c-.69 0-1.25.56-1.25 1.25v10.5c0 .69.56 1.25 1.25 1.25h4.5c.69 0 1.25-.56 1.25-1.25v-.5H13v.5A2.75 2.75 0 0 1 10.25 18h-4.5A2.75 2.75 0 0 1 3 15.25V4.75zm9.22 2.72a.75.75 0 0 1 1.06 0l2.5 2.5a.75.75 0 0 1 0 1.06l-2.5 2.5a.75.75 0 1 1-1.06-1.06l.97-.97H8.25a.75.75 0 0 1 0-1.5h4.94l-.97-.97a.75.75 0 0 1 0-1.06z"
      />
    </svg>
  )
}

export function ParentUserMenu() {
  const navigate = useNavigate()
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const session = useParentAuth((s) => s.session)
  const signOut = useParentAuth((s) => s.signOut)

  useEffect(() => {
    if (!open) return

    const close = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!session) return null

  const handleLogout = () => {
    setOpen(false)
    void signOut().then(() => navigate(paths.loginParent))
  }

  return (
    <div className={styles.wrap} ref={rootRef}>
      <button
        type="button"
        className={[styles.trigger, open ? styles.triggerOpen : ''].filter(Boolean).join(' ')}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
      >
        <span className={styles.userName}>{shortName(session.parentFullName)}</span>
        <StudentAvatar size="sm" />
        <ChevronIcon />
      </button>

      {open ? (
        <div className={styles.menu} role="menu">
          <div className={styles.badges}>
            <span className={[styles.badge, styles.badgeActive].join(' ')} title="Зачётка обучающегося">
              {session.studentId}
            </span>
          </div>

          <ul className={styles.list}>
            <li>
              <button type="button" className={styles.item} role="menuitem" onClick={handleLogout}>
                <LogoutIcon />
                Выйти
              </button>
            </li>
          </ul>
        </div>
      ) : null}
    </div>
  )
}
