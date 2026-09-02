import { useCallback } from 'react'
import { PaymentsPanel } from '@/blocks/payments-panel'
import { ParentDataSection } from '@/layout/parent-locked-section'
import { fetchParentPayments } from '@/payments'
import { useParentAuth } from '@/parent-auth'
import { paths } from '@/paths'

const PAY_RETURN_URL = `https://my.ruc.su${paths.parentPayments}`

export function ParentPayments() {
  const session = useParentAuth((s) => s.session)
  const fetchPayments = useCallback(fetchParentPayments, [])

  const subtitle = session ? `Зачётка ${session.studentId}` : 'Договор и график платежей'

  return (
    <ParentDataSection title="Оплата обучения">
      <PaymentsPanel
        subtitle={subtitle}
        fetchPayments={fetchPayments}
        payReturnUrl={PAY_RETURN_URL}
      />
    </ParentDataSection>
  )
}
