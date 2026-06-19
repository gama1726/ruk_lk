import { Outlet } from 'react-router-dom'
import { Sidebar } from './sidebar'
import { CabinetHeader } from './cabinet-header'
import { Topbar } from './topbar'
import { MobileNav } from './mobile-nav'
import styles from './cabinet.module.css'

export function CabinetShell() {
  return (
    <div className={styles.wrap}>
      <Sidebar />
      <div className={styles.main}>
        <CabinetHeader />
        <Topbar />
        <div className={styles.content}>
          <Outlet />
        </div>
      </div>
      <MobileNav />
    </div>
  )
}
