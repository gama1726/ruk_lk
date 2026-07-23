import { NavLink } from 'react-router-dom'
import { NavIcon, type NavIconId } from '@/icons/nav'
import styles from './nav-link.module.css'

type Props = {
  to: string
  children: string
  icon?: NavIconId
  onClick?: () => void
}

export function MenuLink({ to, children, icon, onClick }: Props) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) => [styles.link, isActive ? styles.active : ''].filter(Boolean).join(' ')}
      end={to === '/'}
    >
      {icon ? <NavIcon id={icon} className={styles.icon} /> : null}
      <span>{children}</span>
    </NavLink>
  )
}
