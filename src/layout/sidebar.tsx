import { NavLink } from 'react-router-dom'
import logo from '@/assets/ruk-logo.png'
import { SocialIcon } from '@/icons/social'
import { socialLinks } from '@/mocks/public-nav'
import { paths } from '@/paths'
import { sidebarTop, sidebarGroups } from '@/nav'
import { MenuLink } from './nav-link'
import { NavGroupBlock } from './nav-group'
import styles from './sidebar.module.css'

export function Sidebar() {
  return (
    <nav className={styles.sidebar} aria-label="Разделы кабинета">
      <div className={styles.head}>
        <NavLink to={paths.profile} className={styles.brand} end>
          <img src={logo} alt="Российский университет кооперации" className={styles.logoImg} />
          <span className={styles.org}>Личный кабинет обучающегося</span>
        </NavLink>
      </div>

      <div className={styles.menu}>
        <ul className={styles.topList}>
          {sidebarTop.map((item) => (
            <li key={item.to}>
              <MenuLink to={item.to}>{item.label}</MenuLink>
            </li>
          ))}
        </ul>

        {sidebarGroups.map((group) => (
          <NavGroupBlock key={group.id} group={group} />
        ))}
      </div>

      <footer className={styles.footer}>
        <div className={styles.social}>
          {socialLinks.map((s) => (
            <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.label} className={styles.socialLink}>
              <SocialIcon id={s.id} className={styles.socialIcon} />
            </a>
          ))}
        </div>
        <p className={styles.copy}>© {new Date().getFullYear()} Российский университет кооперации</p>
      </footer>
    </nav>
  )
}
