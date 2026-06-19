/**
 * @file Оболочка mock-страницы SSO (вне публичной шапки ЛК).
 */

import { Outlet } from 'react-router-dom'
import styles from './sso.module.css'

/**
 * Минимальный layout как у внешнего Keycloak — без меню и подвала портала.
 */
export function SsoLayout() {
  return (
    <div className={styles.wrap}>
      <div className={styles.card}>
        <Outlet />
      </div>
    </div>
  )
}
