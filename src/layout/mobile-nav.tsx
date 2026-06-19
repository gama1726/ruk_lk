import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth'
import { paths } from '@/paths'
import { menu, mobileTabs } from '@/nav'
import { Drawer } from '@/ui/Drawer/Drawer'
import { MenuLink } from './nav-link'
import styles from './mobile-nav.module.css'

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const signOut = useAuth((s) => s.signOut)

  const handleExit = () => {
    signOut()
    navigate(paths.login)
  }

  return (
    <>
      <nav className={styles.bar} aria-label="Быстрая навигация">
        {mobileTabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) => [styles.tab, isActive ? styles.tabActive : ''].filter(Boolean).join(' ')}
            end={tab.to === paths.profile}
          >
            {tab.label}
          </NavLink>
        ))}
        <button type="button" className={styles.tab} onClick={() => setOpen(true)}>
          Меню
        </button>
      </nav>

      <Drawer open={open} title="Разделы" onClose={() => setOpen(false)}>
        <div className={styles.drawerBody}>
          {menu.map((section) => (
            <div key={section.title} className={styles.drawerSection}>
              <p className={styles.drawerTitle}>{section.title}</p>
              <ul className={styles.drawerList}>
                {section.items.map((item) => (
                  <li key={item.to}>
                    <MenuLink to={item.to} onClick={() => setOpen(false)}>
                      {item.label}
                    </MenuLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <button type="button" className={styles.exit} onClick={handleExit}>
            Выйти
          </button>
        </div>
      </Drawer>
    </>
  )
}
