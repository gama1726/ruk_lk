/**
 * @file Шапка и обёртка карточки на экранах входа.
 */

import type { ReactNode } from 'react'
import logo from '@/assets/ruk-logo.png'
import styles from './auth-card.module.css'

export type AuthBrandAudience = 'student' | 'parent' | 'teacher'

const brandSubtitles: Record<AuthBrandAudience, string> = {
  student: 'Личный кабинет обучающегося',
  parent: 'Личный кабинет родителя',
  teacher: 'Личный кабинет преподавателя',
}

/**
 * Карточка входа в стиле портала: логотип, заголовок, содержимое.
 */
export function AuthCard({
  children,
  brand = 'student',
}: {
  children: ReactNode
  brand?: AuthBrandAudience
}) {
  return (
    <div className={styles.card}>
      <AuthBrand audience={brand} />
      {children}
    </div>
  )
}

/**
 * Логотип РУК и подпись кабинета.
 */
export function AuthBrand({ audience = 'student' }: { audience?: AuthBrandAudience }) {
  return (
    <div className={styles.brandRow}>
      <img src={logo} alt="Российский университет кооперации" className={styles.logoImg} />
      <p className={styles.brandSub}>{brandSubtitles[audience]}</p>
    </div>
  )
}
