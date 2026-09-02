/**
 * @file Верхняя шапка родительского кабинета.
 */

import { Link } from 'react-router-dom'
import { publicNav } from '@/data/public-nav'
import { ParentUserMenu } from './parent-user-menu'
import styles from './cabinet-header.module.css'

export function ParentCabinetHeader() {
  return (
    <header className={styles.header}>
      <nav className={styles.nav} aria-label="Публичное меню">
        {publicNav.map((item) =>
          item.href ? (
            <a
              key={item.label}
              href={item.href}
              className={styles.navLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              {item.label}
            </a>
          ) : (
            <Link key={item.label} to={item.to!} className={styles.navLink}>
              {item.label}
            </Link>
          ),
        )}
      </nav>

      <ParentUserMenu />
    </header>
  )
}
