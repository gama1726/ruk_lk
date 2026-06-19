import { Outlet } from 'react-router-dom'
import { Sidebar } from './sidebar'
import { Topbar } from './topbar'
import { MobileNav } from './mobile-nav'
import { ProgramPicker } from './program-picker'
import styles from './cabinet.module.css'

export function CabinetShell() {
  return (
    <div className={styles.wrap}>
      <Sidebar />
      <div className={styles.main}>
        <Topbar />
        <div className={styles.programBar}>
          <ProgramPicker />
        </div>
        <div className={styles.content}>
          <Outlet />
        </div>
      </div>
      <MobileNav />
    </div>
  )
}
