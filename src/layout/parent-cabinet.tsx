import { Outlet } from 'react-router-dom'
import { ParentPaymentDebtWarning } from '@/blocks/payment-debt-warning'
import { ParentCabinetHeader } from './parent-cabinet-header'
import { ParentSidebar } from './parent-sidebar'
import { ParentTopbar } from './parent-topbar'
import styles from './cabinet.module.css'

export function ParentCabinetShell() {
  return (
    <div className={styles.wrap}>
      <ParentPaymentDebtWarning />
      <ParentSidebar />
      <div className={styles.main}>
        <ParentCabinetHeader />
        <ParentTopbar />
        <div className={styles.content}>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
