import { NavLink } from 'react-router-dom'
import logo from '@/assets/ruk-logo.png'
import { paths } from '@/paths'
import { menu } from '@/nav'
import { ProgramPicker } from './program-picker'
import { MenuLink } from './nav-link'
import styles from './sidebar.module.css'

export function Sidebar() {
  return (
    <nav className={styles.sidebar} aria-label="Разделы кабинета">
      <NavLink to={paths.home} className={({ isActive }) => [styles.home, isActive ? styles.homeActive : ''].filter(Boolean).join(' ')} end>
        <img src={logo} alt="Российский университет кооперации" className={styles.logoImg} />
        <span className={styles.org}>Личный кабинет</span>
      </NavLink>

      <div className={styles.picker}>
        <ProgramPicker compact />
      </div>

      {menu.map((section) => (
        <div key={section.title} className={styles.section}>
          <p className={styles.sectionTitle}>{section.title}</p>
          <ul className={styles.list}>
            {section.items.map((item) => (
              <li key={item.to}>
                <MenuLink to={item.to}>{item.label}</MenuLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  )
}
