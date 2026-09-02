import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth'
import { isApiConfigured } from '@/apiClient'
import {
  fetchParentPayments,
  fetchStudentPayments,
  isPaymentsApiEnabled,
  rubMoney,
  type StudentPaymentsDto,
} from '@/payments'
import { useParentAuth } from '@/parent-auth'
import { paths } from '@/paths'
import { Button, Modal } from '@/ui'
import styles from './payment-debt-warning.module.css'

const SESSION_KEY_PREFIX = 'ruk_lk_pay_debt_warned:'

export function hasPaymentDebt(data: StudentPaymentsDto): boolean {
  return data.paymentFound && (data.totals.debt > 0.009 || data.totals.penalty > 0.009)
}

type Audience = 'student' | 'parent'

type ModalCopy = {
  title: string
  lead: string
  hint: string
}

function copyFor(audience: Audience, data: StudentPaymentsDto): ModalCopy {
  if (audience === 'parent') {
    const child = data.studentFullName?.trim()
    const childPart = child ? ` (${child})` : ''
    return {
      title: 'Задолженность по оплате обучения',
      lead: `По договору на обучение вашего ребёнка${childPart} есть задолженность. Пока долг не погашен, на сумму просрочки продолжают начисляться пени.`,
      hint:
        'Вы можете оплатить обучение в разделе «Оплата обучения» — через защищённый сервис университета.',
    }
  }

  return {
    title: 'Задолженность по оплате обучения',
    lead:
      'По вашему договору есть задолженность. Пока долг не погашен, на сумму просрочки продолжают начисляться пени.',
    hint: 'Оплатить можно в разделе «Оплата обучения» — через защищённый сервис университета.',
  }
}

type PaymentDebtWarningModalProps = {
  open: boolean
  data: StudentPaymentsDto
  audience: Audience
  onClose: () => void
  onGoToPayments: () => void
}

function PaymentDebtWarningModal({
  open,
  data,
  audience,
  onClose,
  onGoToPayments,
}: PaymentDebtWarningModalProps) {
  const { totals } = data
  const copy = copyFor(audience, data)

  return (
    <Modal
      open={open}
      title={copy.title}
      onClose={onClose}
      footer={
        <div className={styles.footerActions}>
          <Button type="button" variant="ghost" onClick={onClose}>
            Понятно
          </Button>
          <Button type="button" onClick={onGoToPayments}>
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
        <p className={styles.lead}>{copy.lead}</p>
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
        <p className={styles.hint}>{copy.hint}</p>
      </div>
    </Modal>
  )
}

type DebtWarningContainerProps = {
  audience: Audience
  sessionKey: string | null
  fetchPayments: () => Promise<StudentPaymentsDto>
  paymentsPath: string
  enabled: boolean
}

function PaymentDebtWarningContainer({
  audience,
  sessionKey,
  fetchPayments,
  paymentsPath,
  enabled,
}: DebtWarningContainerProps) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [data, setData] = useState<StudentPaymentsDto | null>(null)

  useEffect(() => {
    if (!enabled || !isApiConfigured() || !isPaymentsApiEnabled() || !sessionKey) return

    const storageKey = SESSION_KEY_PREFIX + sessionKey
    if (sessionStorage.getItem(storageKey) === '1') return

    let cancelled = false
    void (async () => {
      try {
        const result = await fetchPayments()
        if (cancelled) return
        if (!hasPaymentDebt(result)) return
        setData(result)
        setOpen(true)
      } catch {
        // тихо: не мешаем работе ЛК, если оплата недоступна
      }
    })()

    return () => {
      cancelled = true
    }
  }, [enabled, sessionKey, fetchPayments])

  const dismiss = useCallback(() => {
    if (sessionKey) {
      sessionStorage.setItem(SESSION_KEY_PREFIX + sessionKey, '1')
    }
    setOpen(false)
  }, [sessionKey])

  const goToPayments = useCallback(() => {
    dismiss()
    void navigate(paymentsPath)
  }, [dismiss, navigate, paymentsPath])

  if (!data) return null

  return (
    <PaymentDebtWarningModal
      open={open}
      data={data}
      audience={audience}
      onClose={dismiss}
      onGoToPayments={goToPayments}
    />
  )
}

/**
 * Модальное предупреждение о задолженности по оплате обучения.
 * Показывается один раз за сессию браузера при входе в ЛК студента.
 */
export function PaymentDebtWarning() {
  const studentId = useAuth((s) => s.session?.studentId)

  return (
    <PaymentDebtWarningContainer
      audience="student"
      sessionKey={studentId ?? null}
      fetchPayments={fetchStudentPayments}
      paymentsPath={paths.payments}
      enabled={Boolean(studentId)}
    />
  )
}

/**
 * То же предупреждение для родительского кабинета — с обращением к родителю.
 */
export function ParentPaymentDebtWarning() {
  const session = useParentAuth((s) => s.session)
  const sessionKey = session ? `parent:${session.studentId}` : null

  return (
    <PaymentDebtWarningContainer
      audience="parent"
      sessionKey={sessionKey}
      fetchPayments={fetchParentPayments}
      paymentsPath={paths.parentPayments}
      enabled={Boolean(session?.dataAccessAllowed)}
    />
  )
}
