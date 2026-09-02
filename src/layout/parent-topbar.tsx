import { NavLink } from 'react-router-dom'
import logo from '@/assets/ruk-logo.png'
import { paths } from '@/paths'
import { ParentUserMenu } from './parent-user-menu'
import styles from './topbar.module.css'

export function ParentTopbar() {
  return (
    <header className={styles.topbar}>
      <NavLink to={paths.parentHome} className={styles.brand} end>
        <img src={logo} alt="Российский университет кооперации" className={styles.brandLogo} />
      </NavLink>
      <ParentUserMenu />
    </header>
  )
}
