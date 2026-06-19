/**
 * @file Верхняя шапка кабинета: публичные ссылки и профиль пользователя.
 */

import { Link } from 'react-router-dom'
import { publicNav } from '@/mocks/public-nav'
import { UserMenu } from './user-menu'
import styles from './cabinet-header.module.css'

/**
 * Десктопная шапка над контентом кабинета.
 */
export function CabinetHeader() {
  return (
    <header className={styles.header}>
      <nav className={styles.nav} aria-label="Публичное меню">
        {publicNav.map((item) => (
          <Link key={item.label} to={item.to} className={styles.navLink}>
            {item.label}
          </Link>
        ))}
      </nav>

      <UserMenu />
    </header>
  )
}
