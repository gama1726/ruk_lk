import { NavLink } from 'react-router-dom'
import { NavIcon, type NavIconId } from '@/icons/nav'
import styles from './nav-link.module.css'
import lockedStyles from './nav-link-locked.module.css'

type Props = {
  to: string
  children: string
  icon?: NavIconId
  locked?: boolean
  lockTitle?: string
  onClick?: () => void
}

export function MenuLink({ to, children, icon, locked, lockTitle, onClick }: Props) {
  if (locked) {
    return (
      <span
        className={[styles.link, lockedStyles.locked].join(' ')}
        title={lockTitle}
        aria-disabled="true"
      >
        {icon ? <NavIcon id={icon} className={[styles.icon, lockedStyles.icon].join(' ')} /> : null}
        <span>{children}</span>
      </span>
    )
  }

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

export function ParentMenuLink(props: Props) {
  return <MenuLink {...props} />
}
