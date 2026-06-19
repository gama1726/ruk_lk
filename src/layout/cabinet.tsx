import { Outlet } from 'react-router-dom'
import styles from './cabinet.module.css'

export function CabinetShell() {
  return (
    <div className={styles.shell}>
      <Outlet />
    </div>
  )
}
