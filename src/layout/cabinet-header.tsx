/**
 * @file Верхняя шапка кабинета: публичные ссылки и профиль пользователя.
 */

import { Link } from 'react-router-dom'
import { useAuth } from '@/auth'
import { publicNav } from '@/mocks/public-nav'
import { firstName } from '@/mocks/format'
import styles from './cabinet-header.module.css'

function shortName(full: string) {
  const parts = full.split(' ')
  if (parts.length < 2) return full
  return `${parts[0]} ${parts[1][0]}.`
}

/**
 * Десктопная шапка над контентом кабинета.
 */
export function CabinetHeader() {
  const name = useAuth((s) => s.session?.name)

  return (
    <header className={styles.header}>
      <nav className={styles.nav} aria-label="Публичное меню">
        {publicNav.map((item) => (
          <Link key={item.label} to={item.to} className={styles.navLink}>
            {item.label}
          </Link>
        ))}
      </nav>

      {name ? (
        <div className={styles.user}>
          <span className={styles.userName}>{shortName(name)}</span>
          <span className={styles.avatar} aria-hidden="true">
            {firstName(name).charAt(0)}
          </span>
        </div>
      ) : null}
    </header>
  )
}
