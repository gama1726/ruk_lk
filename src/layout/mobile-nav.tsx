import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth'
import { isAttendanceNavVisible } from '@/campus'
import { NavIcon } from '@/icons/nav'
import { paths } from '@/paths'
import { buildMenu, mobileTabs } from '@/nav'
import { useStudentProfile } from '@/student-profile-store'
import { Drawer } from '@/ui/Drawer/Drawer'
import { MenuLink } from './nav-link'
import styles from './mobile-nav.module.css'

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const signOut = useAuth((s) => s.signOut)
  const profile = useStudentProfile((s) => s.profile)
  const status = useStudentProfile((s) => s.status)
  const load = useStudentProfile((s) => s.load)

  useEffect(() => {
    if (status === 'idle') void load()
  }, [status, load])

  const menu = buildMenu({ attendance: isAttendanceNavVisible(profile) })

  const handleExit = () => {
    void signOut().then(() => navigate(paths.login))
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
            {tab.icon ? <NavIcon id={tab.icon} className={styles.tabIcon} /> : null}
            <span>{tab.label}</span>
          </NavLink>
        ))}
        <button type="button" className={styles.tab} onClick={() => setOpen(true)}>
          <span className={styles.menuGlyph} aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <span>Меню</span>
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
                    <MenuLink to={item.to} icon={item.icon} onClick={() => setOpen(false)}>
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
