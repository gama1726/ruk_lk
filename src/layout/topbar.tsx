import { NavLink } from 'react-router-dom'
import logo from '@/assets/ruk-logo.png'
import { paths } from '@/paths'
import { UserMenu } from './user-menu'
import styles from './topbar.module.css'

export function Topbar() {
  return (
    <header className={styles.topbar}>
      <NavLink to={paths.profile} className={styles.brand} end>
        <img src={logo} alt="Российский университет кооперации" className={styles.brandLogo} />
      </NavLink>
      <UserMenu />
    </header>
  )
}
