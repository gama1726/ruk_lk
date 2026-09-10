import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { ParentBetaTestingNotice } from '@/blocks/beta-testing-notice'
import { ParentPaymentDebtWarning } from '@/blocks/payment-debt-warning'
import { useAppFeatures } from '@/features'
import { ParentCabinetHeader } from './parent-cabinet-header'
import { ParentSidebar } from './parent-sidebar'
import { ParentTopbar } from './parent-topbar'
import styles from './cabinet.module.css'

export function ParentCabinetShell() {
  const featuresStatus = useAppFeatures((s) => s.status)
  const loadFeatures = useAppFeatures((s) => s.load)

  useEffect(() => {
    if (featuresStatus === 'idle') void loadFeatures()
  }, [featuresStatus, loadFeatures])

  return (
    <div className={styles.wrap}>
      <ParentBetaTestingNotice />
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
