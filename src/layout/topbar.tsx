import { NavLink } from 'react-router-dom'
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
      <NavLink to={paths.home} className={styles.brand} end>
        <span className={styles.brandMark}>РУК</span>
        <span className={styles.brandText}>Российский университет кооперации</span>
      </NavLink>
      {name ? <span className={styles.user}>{shortName(name)}</span> : null}
    </header>
  )
}
