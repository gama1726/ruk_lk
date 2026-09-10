import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/auth'
import { supportContacts } from '@/mocks/public'
import { useParentAuth } from '@/parent-auth'
import { Button, Modal } from '@/ui'
import styles from './beta-testing-notice.module.css'

export const BETA_NOTICE_SESSION_KEY_PREFIX = 'ruk_lk_beta_notice_seen:'
export const BETA_NOTICE_DISMISSED_EVENT = 'ruk_lk_beta_notice_dismissed'

export function isBetaNoticeSeen(sessionKey: string | null | undefined): boolean {
  if (!sessionKey) return true
  return sessionStorage.getItem(BETA_NOTICE_SESSION_KEY_PREFIX + sessionKey) === '1'
}

type BetaTestingNoticeModalProps = {
  open: boolean
  onClose: () => void
}

function BetaTestingNoticeModal({ open, onClose }: BetaTestingNoticeModalProps) {
  const email = supportContacts.email

  return (
    <Modal
      open={open}
      title="Бета-тестирование личного кабинета"
      onClose={onClose}
      footer={
        <div className={styles.footerActions}>
          <Button type="button" onClick={onClose}>
            Понятно
          </Button>
        </div>
      }
    >
      <div className={styles.content}>
        <img
          className={styles.illustration}
          src="/illustrations/beta-testing-notice.png"
          alt=""
          width={480}
          height={270}
        />
        <p className={styles.lead}>
          Сервис работает в режиме бета-тестирования с реальными пользователями. Возможны
          незначительные ошибки и недочёты — мы быстро их исправляем.
        </p>
        <p className={styles.hint}>
          Будем очень благодарны за обратную связь: замечания, предложения и сообщения о сбоях
          помогают сделать кабинет удобнее.
        </p>
        <p className={styles.support}>
          Техподдержка:{' '}
          <a href={`mailto:${email}`}>{email}</a>
        </p>
      </div>
    </Modal>
  )
}

type BetaTestingNoticeContainerProps = {
  sessionKey: string | null
  enabled: boolean
}

function BetaTestingNoticeContainer({ sessionKey, enabled }: BetaTestingNoticeContainerProps) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!enabled || !sessionKey) return
    if (isBetaNoticeSeen(sessionKey)) return
    setOpen(true)
  }, [enabled, sessionKey])

  const dismiss = useCallback(() => {
    if (sessionKey) {
      sessionStorage.setItem(BETA_NOTICE_SESSION_KEY_PREFIX + sessionKey, '1')
      window.dispatchEvent(new CustomEvent(BETA_NOTICE_DISMISSED_EVENT))
    }
    setOpen(false)
  }, [sessionKey])

  return <BetaTestingNoticeModal open={open} onClose={dismiss} />
}

/**
 * Уведомление о бета-тестировании. Показывается один раз за сессию браузера при входе в ЛК.
 */
export function BetaTestingNotice() {
  const studentId = useAuth((s) => s.session?.studentId)

  return (
    <BetaTestingNoticeContainer sessionKey={studentId ?? null} enabled={Boolean(studentId)} />
  )
}

/**
 * То же уведомление для родительского кабинета.
 */
export function ParentBetaTestingNotice() {
  const session = useParentAuth((s) => s.session)
  const sessionKey = session ? `parent:${session.studentId}` : null

  return <BetaTestingNoticeContainer sessionKey={sessionKey} enabled={Boolean(session)} />
}
