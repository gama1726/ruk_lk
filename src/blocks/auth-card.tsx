/**
 * @file Шапка и обёртка карточки на экранах входа.
 */

import type { ReactNode } from 'react'
import styles from './auth-card.module.css'

/**
 * Карточка входа в стиле портала: логотип, заголовок, содержимое.
 */
export function AuthCard({ children }: { children: ReactNode }) {
  return (
    <div className={styles.card}>
      <AuthBrand />
      {children}
    </div>
  )
}

/**
 * Логотип РУК и название университета.
 */
export function AuthBrand() {
  return (
    <div className={styles.brandRow}>
      <div className={styles.logo} aria-hidden="true">
        РУК
      </div>
      <div className={styles.brandText}>
        <p className={styles.brandSub}>Личный кабинет обучающегося</p>
        <p className={styles.brandName}>Российский университет кооперации</p>
      </div>
    </div>
  )
}
