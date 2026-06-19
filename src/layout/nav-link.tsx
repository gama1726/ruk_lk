import { NavLink } from 'react-router-dom'
import styles from './nav-link.module.css'

type Props = {
  to: string
  children: string
  onClick?: () => void
}

export function MenuLink({ to, children, onClick }: Props) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) => [styles.link, isActive ? styles.active : ''].filter(Boolean).join(' ')}
      end={to === '/'}
    >
      {children}
    </NavLink>
  )
}
