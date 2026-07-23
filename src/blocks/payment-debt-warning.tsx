import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth'
import { isApiConfigured } from '@/apiClient'
import {
  fetchStudentPayments,
  isPaymentsApiEnabled,
  rubMoney,
  type StudentPaymentsDto,
} from '@/payments'
import { paths } from '@/paths'
import { Button, Modal } from '@/ui'
import styles from './payment-debt-warning.module.css'

const SESSION_KEY_PREFIX = 'ruk_lk_pay_debt_warned:'

function hasDebt(data: StudentPaymentsDto): boolean {
  return data.paymentFound && (data.totals.debt > 0.009 || data.totals.penalty > 0.009)
}

/**
 * Модальное предупреждение о задолженности по оплате обучения.
 * Показывается один раз за сессию браузера при входе в ЛК.
 */
export function PaymentDebtWarning() {
  const navigate = useNavigate()
  const studentId = useAuth((s) => s.session?.studentId)
  const [open, setOpen] = useState(false)
  const [data, setData] = useState<StudentPaymentsDto | null>(null)

  useEffect(() => {
    if (!isApiConfigured() || !isPaymentsApiEnabled() || !studentId) return

    const storageKey = SESSION_KEY_PREFIX + studentId
    if (sessionStorage.getItem(storageKey) === '1') return

    let cancelled = false
    void (async () => {
      try {
        const result = await fetchStudentPayments()
        if (cancelled) return
        if (!hasDebt(result)) return
        setData(result)
        setOpen(true)
      } catch {
        // тихо: не мешаем работе ЛК, если оплата недоступна
      }
    })()

    return () => {
      cancelled = true
    }
  }, [studentId])

  const dismiss = useCallback(() => {
    if (studentId) {
      sessionStorage.setItem(SESSION_KEY_PREFIX + studentId, '1')
    }
    setOpen(false)
  }, [studentId])

  const goToPayments = useCallback(() => {
    dismiss()
    void navigate(paths.payments)
  }, [dismiss, navigate])

  if (!data) return null

  const { totals } = data

  return (
    <Modal
      open={open}
      title="Задолженность по оплате обучения"
      onClose={dismiss}
      footer={
        <div className={styles.footerActions}>
          <Button type="button" variant="ghost" onClick={dismiss}>
            Понятно
          </Button>
          <Button type="button" onClick={goToPayments}>
            Перейти к оплате
          </Button>
        </div>
      }
    >
      <div className={styles.content}>
        <img
          className={styles.illustration}
          src="/illustrations/payment-debt-warning.png"
          alt=""
          width={480}
          height={270}
        />
        <p className={styles.lead}>
          По вашему договору есть задолженность. Пока долг не погашен, на сумму просрочки
          продолжают начисляться пени.
        </p>
        <ul className={styles.facts}>
          <li>
            <span>Долг</span>
            <strong>{rubMoney(totals.debt)}</strong>
          </li>
          {totals.penalty > 0 && (
            <li>
              <span>Пени</span>
              <strong>{rubMoney(totals.penalty)}</strong>
            </li>
          )}
          <li>
            <span>К оплате</span>
            <strong className={styles.total}>{rubMoney(totals.totalToPay)}</strong>
          </li>
        </ul>
        <p className={styles.hint}>
          Оплатить можно в разделе «Оплата обучения» — через защищённый сервис университета.
        </p>
      </div>
    </Modal>
  )
}
