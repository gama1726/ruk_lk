/**
 * @file Сайдбар родительского кабинета.
 */

import { NavLink } from 'react-router-dom'
import logo from '@/assets/ruk-logo.png'
import { paths } from '@/paths'
import { parentSidebarGroups, parentSidebarTop } from '@/parent-nav'
import { useParentAuth } from '@/parent-auth'
import { PARENT_CONSENT_MESSAGE } from '@/parent-consent'
import { ParentMenuLink } from './nav-link'
import styles from './sidebar.module.css'
import groupStyles from './nav-group.module.css'
import { NavIcon } from '@/icons/nav'
import { useState } from 'react'
import { useLocation } from 'react-router-dom'

export function ParentSidebar() {
  const session = useParentAuth((s) => s.session)
  const dataAllowed = session?.dataAccessAllowed !== false
  const lockTitle = session?.consentRequiredMessage ?? PARENT_CONSENT_MESSAGE

  return (
    <nav className={styles.sidebar} aria-label="Разделы кабинета родителя">
      <div className={styles.head}>
        <NavLink to={paths.parentHome} className={styles.brand} end>
          <img src={logo} alt="Российский университет кооперации" className={styles.logoImg} />
          <span className={styles.org}>Личный кабинет родителя</span>
        </NavLink>
      </div>

      <div className={styles.menu}>
        <ul className={styles.topList}>
          {parentSidebarTop.map((item) => (
            <li key={item.to}>
              <ParentMenuLink
                to={item.to}
                icon={item.icon}
                locked={!dataAllowed && item.requiresDataAccess !== false}
                lockTitle={lockTitle}
              >
                {item.label}
              </ParentMenuLink>
            </li>
          ))}
        </ul>

        {parentSidebarGroups.map((group) => (
          <ParentNavGroup
            key={group.id}
            group={group}
            dataAllowed={dataAllowed}
            lockTitle={lockTitle}
          />
        ))}
      </div>
    </nav>
  )
}

function ParentNavGroup({
  group,
  dataAllowed,
  lockTitle,
}: {
  group: (typeof parentSidebarGroups)[number]
  dataAllowed: boolean
  lockTitle: string
}) {
  const { pathname } = useLocation()
  const hasActive = group.items.some((item) => pathname === item.to)
  const [open, setOpen] = useState(hasActive)

  return (
    <div className={groupStyles.group}>
      <button
        type="button"
        className={[groupStyles.toggle, open ? groupStyles.toggleOpen : ''].filter(Boolean).join(' ')}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className={groupStyles.toggleLabel}>
          <NavIcon id={group.icon} className={groupStyles.icon} />
          <span>{group.label}</span>
        </span>
        <svg className={groupStyles.chevron} viewBox="0 0 20 20" width="16" height="16" aria-hidden="true">
          <path fill="currentColor" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.25a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08z" />
        </svg>
      </button>
      {open ? (
        <ul className={groupStyles.list}>
          {group.items.map((item) => (
            <li key={item.to}>
              <ParentMenuLink
                to={item.to}
                icon={item.icon}
                locked={!dataAllowed}
                lockTitle={lockTitle}
              >
                {item.label}
              </ParentMenuLink>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
