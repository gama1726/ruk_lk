/**
 * @file Раскрывающаяся группа пунктов в сайдбаре.
 */

import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { NavIcon } from '@/icons/nav'
import type { NavGroup } from '@/nav'
import { MenuLink } from './nav-link'
import styles from './nav-group.module.css'

type Props = {
  group: NavGroup
}

/**
 * @param props.group - заголовок и вложенные ссылки
 */
export function NavGroupBlock({ group }: Props) {
  const { pathname } = useLocation()
  const hasActive = group.items.some((item) => pathname === item.to || pathname.startsWith(`${item.to}/`))
  const [open, setOpen] = useState(hasActive)

  return (
    <div className={styles.group}>
      <button
        type="button"
        className={[styles.toggle, open ? styles.toggleOpen : ''].filter(Boolean).join(' ')}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className={styles.toggleLabel}>
          <NavIcon id={group.icon} className={styles.icon} />
          <span>{group.label}</span>
        </span>
        <svg className={styles.chevron} viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
          <path fill="currentColor" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.25a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08z" />
        </svg>
      </button>
      {open ? (
        <ul className={styles.list}>
          {group.items.map((item) => (
            <li key={item.to}>
              <MenuLink to={item.to}>{item.label}</MenuLink>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
