import { NavLink } from 'react-router-dom'
import logo from '@/assets/ruk-logo.png'
import { useAuth } from '@/auth'
import { paths } from '@/paths'
import styles from './topbar.module.css'

function shortName(full: string) {
  const parts = full.split(' ')
  if (parts.length < 2) return full
  return `${parts[0]} ${parts[1][0]}.`
}

export function Topbar() {
  const name = useAuth((s) => s.session?.name)

  return (
    <header className={styles.topbar}>
      <NavLink to={paths.profile} className={styles.brand} end>
        <img src={logo} alt="Российский университет кооперации" className={styles.brandLogo} />
      </NavLink>
      {name ? <span className={styles.user}>{shortName(name)}</span> : null}
    </header>
  )
}
