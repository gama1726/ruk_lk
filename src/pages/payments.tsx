/**
 * @file Оплата обучения: договор и график из 1С.
 */

import { useCallback } from 'react'
import { PaymentsPanel } from '@/blocks/payments-panel'
import { fetchStudentPayments } from '@/payments'
import { paths } from '@/paths'

const PAY_RETURN_URL = `https://my.ruc.su${paths.payments}`

/**
 * Оплата обучения: договор, график начислений.
 */
export function Payments() {
  const fetchPayments = useCallback(fetchStudentPayments, [])

  return (
    <PaymentsPanel
      subtitle="Договор и график платежей"
      fetchPayments={fetchPayments}
      payReturnUrl={PAY_RETURN_URL}
    />
  )
}
