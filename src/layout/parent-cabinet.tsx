import { Outlet } from 'react-router-dom'
import { ParentSidebar } from './parent-sidebar'
import styles from './cabinet.module.css'

export function ParentCabinetShell() {
  return (
    <div className={styles.wrap}>
      <ParentSidebar />
      <div className={styles.main}>
        <div className={styles.content}>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
