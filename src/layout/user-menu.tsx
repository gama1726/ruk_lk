/**
 * @file Выпадающее меню пользователя: номера по программам, настройки, выход.
 */

import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth'
import { student } from '@/mocks/student'
import { firstName } from '@/mocks/format'
import { paths } from '@/paths'
import { useStudy } from '@/study'
import styles from './user-menu.module.css'

function shortName(full: string) {
  const parts = full.split(' ')
  if (parts.length < 2) return full
  return `${parts[0]} ${parts[1][0]}.`
}

type MenuItem = {
  to: string
  label: string
  icon: 'mail' | 'lock' | 'phone' | 'logout'
}

const items: MenuItem[] = [
  { to: `${paths.settings}#email`, label: 'Изменить e-mail', icon: 'mail' },
  { to: `${paths.settings}#password`, label: 'Изменить пароль', icon: 'lock' },
  { to: `${paths.settings}#phone`, label: 'Изменить телефон', icon: 'phone' },
]

function MenuIcon({ kind }: { kind: MenuItem['icon'] | 'chevron' }) {
  if (kind === 'chevron') {
    return (
      <svg className={styles.chevron} viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
        <path fill="currentColor" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.25a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08z" />
      </svg>
    )
  }

  const paths: Record<MenuItem['icon'], string> = {
    mail: 'M2.003 5.884 10 9.882l7.997-3.998A2 2 0 0 0 16 4H4a2 2 0 0 0-1.997 1.884z M18 8.118l-8 4-8-4V14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8.118z',
    lock: 'M5 9V7a5 5 0 0 1 10 0v2h1a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1h1zm2 0h6V7a3 3 0 0 0-6 0v2z',
    phone:
      'M2 3a1 1 0 0 1 1-1h2.153a1 1 0 0 1 .986.836l.74 4.435a1 1 0 0 1-.54 1.06l-1.548.773a11.037 11.037 0 0 0 6.105 6.105l.774-1.548a1 1 0 0 1 1.059-.54l4.435.74a1 1 0 0 1 .836.986V17a1 1 0 0 1-1 1h-2C7.82 18 2 12.18 2 5V3z',
    logout:
      'M3 4.75A2.75 2.75 0 0 1 5.75 2h4.5A2.75 2.75 0 0 1 13 4.75v.5h-1.5v-.5c0-.69-.56-1.25-1.25-1.25h-4.5c-.69 0-1.25.56-1.25 1.25v10.5c0 .69.56 1.25 1.25 1.25h4.5c.69 0 1.25-.56 1.25-1.25v-.5H13v.5A2.75 2.75 0 0 1 10.25 18h-4.5A2.75 2.75 0 0 1 3 15.25V4.75zm9.22 2.72a.75.75 0 0 1 1.06 0l2.5 2.5a.75.75 0 0 1 0 1.06l-2.5 2.5a.75.75 0 1 1-1.06-1.06l.97-.97H8.25a.75.75 0 0 1 0-1.5h4.94l-.97-.97a.75.75 0 0 1 0-1.06z',
  }

  return (
    <svg className={styles.itemIcon} viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
      <path fill="currentColor" d={paths[kind]} />
    </svg>
  )
}

/**
 * Кнопка с именем и меню: переключение программы по номеру студенческого.
 */
export function UserMenu() {
  const navigate = useNavigate()
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const name = useAuth((s) => s.session?.name)
  const signOut = useAuth((s) => s.signOut)
  const activeId = useStudy((s) => s.activeId)
  const pick = useStudy((s) => s.pick)

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

  if (!name) return null

  const handleLogout = () => {
    setOpen(false)
    signOut()
    navigate(paths.login)
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
        <span className={styles.userName}>{shortName(name)}</span>
        <span className={styles.avatar} aria-hidden="true">
          {firstName(name).charAt(0)}
        </span>
        <MenuIcon kind="chevron" />
      </button>

      {open ? (
        <div className={styles.menu} role="menu">
          <div className={styles.badges}>
            {student.programs.map((program) => {
              const active = program.id === activeId
              return (
                <button
                  key={program.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={active}
                  className={[styles.badge, active ? styles.badgeActive : styles.badgeIdle].filter(Boolean).join(' ')}
                  title={program.level}
                  onClick={() => pick(program.id)}
                >
                  {program.cardNumber}
                </button>
              )
            })}
          </div>

          <ul className={styles.list}>
            {items.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={styles.item}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                >
                  <MenuIcon kind={item.icon} />
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <button type="button" className={styles.item} role="menuitem" onClick={handleLogout}>
                <MenuIcon kind="logout" />
                Выйти
              </button>
            </li>
          </ul>
        </div>
      ) : null}
    </div>
  )
}
