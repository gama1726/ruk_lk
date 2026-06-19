/**
 * @file Шапка и обёртка карточки на экранах входа.
 */

import type { ReactNode } from 'react'
import logo from '@/assets/ruk-logo.png'
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
 * Логотип РУК и подпись кабинета.
 */
export function AuthBrand() {
  return (
    <div className={styles.brandRow}>
      <img src={logo} alt="Российский университет кооперации" className={styles.logoImg} />
      <p className={styles.brandSub}>Личный кабинет обучающегося</p>
    </div>
  )
}
