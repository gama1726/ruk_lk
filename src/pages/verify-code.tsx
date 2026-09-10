/**
 * @file Ввод кода после отправки на email / MAX.
 */

import { useEffect, useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth'
import { paths } from '@/paths'
import { AuthCard } from '@/blocks/auth-card'
import card from '@/blocks/auth-card.module.css'
import { remainingCooldownSec, sendCodeCooldownSec } from '@/send-code-cooldown'
import { Input, Button } from '@/ui'
import styles from './auth-form.module.css'

const RESEND_AFTER_MS = 60_000

export function Verify() {
  const navigate = useNavigate()
  const pendingLogin = useAuth((s) => s.pendingLogin)
  const pendingIdentification = useAuth((s) => s.pendingIdentification)
  const confirmCode = useAuth((s) => s.confirmCode)
  const resendLoginCode = useAuth((s) => s.resendLoginCode)
  const [codeError, setCodeError] = useState<string>()
  const [resendError, setResendError] = useState<string>()
  const [busy, setBusy] = useState(false)
  const [resendBusy, setResendBusy] = useState(false)
  const [sentAtMs, setSentAtMs] = useState(() => Date.now())
  const [nowMs, setNowMs] = useState(() => Date.now())
  const [cooldownUntilMs, setCooldownUntilMs] = useState<number>()

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 500)
    return () => window.clearInterval(id)
  }, [])

  if (!pendingLogin) {
    if (pendingIdentification) {
      return <Navigate to={paths.loginDelivery} replace />
    }
    return <Navigate to={paths.loginStudent} replace />
  }

  const isMax = pendingLogin.channel === 'MAX'
  const deliveryLabel = pendingLogin.deliveryHint
  const waitLeftSec = Math.max(0, Math.ceil((sentAtMs + RESEND_AFTER_MS - nowMs) / 1000))
  const canShowResend = waitLeftSec === 0
  const cooldownLeft = remainingCooldownSec(cooldownUntilMs, nowMs)
  const onCooldown = cooldownLeft > 0

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setCodeError(undefined)
    setResendError(undefined)

    const form = new FormData(e.currentTarget)
    const code = String(form.get('code') ?? '')

    setBusy(true)
    const error = await confirmCode(code)
    setBusy(false)

    if (error) {
      setCodeError(error)
      return
    }

    navigate(paths.profile)
  }

  const handleResend = async () => {
    setResendError(undefined)
    setCodeError(undefined)
    if (!canShowResend || onCooldown) return

    setResendBusy(true)
    const error = await resendLoginCode()
    setResendBusy(false)

    if (error) {
      const pause = sendCodeCooldownSec(error)
      if (pause > 0) {
        setCooldownUntilMs(Date.now() + pause * 1000)
      }
      setResendError(error)
      return
    }

    setSentAtMs(Date.now())
    setCooldownUntilMs(undefined)
  }

  return (
    <AuthCard>
      <p className={card.sectionLabel}>Подтверждение входа</p>
      <form className={styles.form} onSubmit={(e) => void handleSubmit(e)}>
        <p className={styles.hint}>
          {isMax ? (
            <>
              Код отправлен на номер <strong>{deliveryLabel}</strong> в мессенджер MAX. Откройте чат с
              ботом университета.
            </>
          ) : (
            <>
              Код отправлен на <strong>{deliveryLabel}</strong>. Проверьте входящие и папку «Спам».
            </>
          )}
        </p>
        <p className={styles.hint}>Код придёт в течение 1 минуты.</p>
        <Input
          label={isMax ? 'Код из MAX' : 'Код из письма'}
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="000000"
          className={styles.code}
          error={codeError}
          disabled={busy}
        />
        <Button type="submit" fullWidth loading={busy} size="lg">
          Подтвердить
        </Button>
      </form>

      {!canShowResend ? (
        <p className={styles.hint}>Если код не пришёл, повторная отправка будет доступна через {waitLeftSec} с.</p>
      ) : (
        <div className={styles.form} style={{ marginTop: '0.75rem' }}>
          {resendError ? <p className={styles.error}>{resendError}</p> : null}
          <Button
            type="button"
            fullWidth
            size="lg"
            variant="secondary"
            loading={resendBusy}
            disabled={onCooldown}
            onClick={() => void handleResend()}
          >
            {onCooldown ? `Повтор через ${cooldownLeft} с.` : 'Отправить снова'}
          </Button>
        </div>
      )}
    </AuthCard>
  )
}
