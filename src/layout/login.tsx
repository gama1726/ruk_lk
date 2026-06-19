import { Outlet } from 'react-router-dom'
import styles from './login.module.css'

export function LoginShell() {
  return (
    <div className={styles.wrap}>
      <div className={styles.box}>
        <div className={styles.brand}>
          <div className={styles.logo} aria-hidden="true">
            РУК
          </div>
          <p className={styles.org}>Российский университет кооперации</p>
        </div>
        <Outlet />
      </div>
    </div>
  )
}
