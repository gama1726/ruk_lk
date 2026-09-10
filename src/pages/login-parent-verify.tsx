/**
 * @file Вход для родителя — шаг 3: код подтверждения.
 */

import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { paths } from '@/paths'
import { useParentAuth } from '@/parent-auth'
import { AuthCard } from '@/blocks/auth-card'
import card from '@/blocks/auth-card.module.css'
import { remainingCooldownSec, sendCodeCooldownSec } from '@/send-code-cooldown'
import { Input, Button } from '@/ui'
import form from './auth-form.module.css'
import pub from './public.module.css'

const RESEND_AFTER_MS = 60_000

export function ParentLoginVerify() {
  const navigate = useNavigate()
  const pendingChallenge = useParentAuth((s) => s.pendingChallenge)
  const confirmCode = useParentAuth((s) => s.confirmCode)
  const resendLoginCode = useParentAuth((s) => s.resendLoginCode)
  const [error, setError] = useState<string>()
  const [resendError, setResendError] = useState<string>()
  const [busy, setBusy] = useState(false)
  const [resendBusy, setResendBusy] = useState(false)
  const [sentAtMs, setSentAtMs] = useState(() => Date.now())
  const [nowMs, setNowMs] = useState(() => Date.now())
  const [cooldownUntilMs, setCooldownUntilMs] = useState<number>()

  useEffect(() => {
    if (!pendingChallenge) {
      navigate(paths.loginParent, { replace: true })
    }
  }, [pendingChallenge, navigate])

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 500)
    return () => window.clearInterval(id)
  }, [])

  if (!pendingChallenge) {
    return null
  }

  const waitLeftSec = Math.max(0, Math.ceil((sentAtMs + RESEND_AFTER_MS - nowMs) / 1000))
  const canShowResend = waitLeftSec === 0
  const cooldownLeft = remainingCooldownSec(cooldownUntilMs, nowMs)
  const onCooldown = cooldownLeft > 0

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(undefined)
    setResendError(undefined)
    const data = new FormData(e.currentTarget)
    const code = String(data.get('code') ?? '')
    setBusy(true)
    const err = await confirmCode(code)
    setBusy(false)
    if (err) {
      setError(err)
      return
    }
    navigate(paths.parentHome, { replace: true })
  }

  const handleResend = async () => {
    setResendError(undefined)
    setError(undefined)
    if (!canShowResend || onCooldown) return

    setResendBusy(true)
    const err = await resendLoginCode()
    setResendBusy(false)

    if (err) {
      const pause = sendCodeCooldownSec(err)
      if (pause > 0) {
        setCooldownUntilMs(Date.now() + pause * 1000)
      }
      setResendError(err)
      return
    }

    setSentAtMs(Date.now())
    setCooldownUntilMs(undefined)
  }

  return (
    <>
      <AuthCard brand="parent">
        <p className={card.sectionLabel}>Код подтверждения</p>
        <p className={form.hint}>Код отправлен: {pendingChallenge.deliveryHint}</p>
        <p className={form.hint}>Код придёт в течение 1 минуты.</p>
        <form className={form.form} onSubmit={(e) => void handleSubmit(e)}>
          <Input
            label="Код из 6 цифр"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            error={error}
            disabled={busy}
          />
          <Button type="submit" fullWidth size="lg" loading={busy}>
            Войти
          </Button>
        </form>

        {!canShowResend ? (
          <p className={form.hint}>
            Если код не пришёл, повторная отправка будет доступна через {waitLeftSec} с.
          </p>
        ) : (
          <div className={form.form} style={{ marginTop: '0.75rem' }}>
            {resendError ? <p className={form.error}>{resendError}</p> : null}
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
      <p className={pub.back}>
        <Link to={paths.loginParent}>Начать заново</Link>
      </p>
    </>
  )
}
