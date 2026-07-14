/**
 * @file Вход по зачётке — шаг 2: выбор канала доставки кода.
 */

import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth, type LoginCodeChannel } from '@/auth'
import { paths } from '@/paths'
import { LoginChannelPicker } from '@/blocks/login-channel-picker'
import { AuthCard } from '@/blocks/auth-card'
import card from '@/blocks/auth-card.module.css'
import { Button } from '@/ui'
import form from './auth-form.module.css'

export function LoginDelivery() {
  const navigate = useNavigate()
  const pendingIdentification = useAuth((s) => s.pendingIdentification)
  const sendLoginCode = useAuth((s) => s.sendLoginCode)
  const fetchLoginChannels = useAuth((s) => s.fetchLoginChannels)
  const fetchMaxBindLink = useAuth((s) => s.fetchMaxBindLink)
  const refreshPendingIdentification = useAuth((s) => s.refreshPendingIdentification)
  const [channel, setChannel] = useState<LoginCodeChannel>('EMAIL')
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)
  const [maxEnabled, setMaxEnabled] = useState(false)
  const [bindUrl, setBindUrl] = useState<string>()
  const [bindBusy, setBindBusy] = useState(false)
  const [checkBusy, setCheckBusy] = useState(false)

  useEffect(() => {
    void fetchLoginChannels().then((c) => setMaxEnabled(c.maxEnabled))
  }, [fetchLoginChannels])

  const needsMaxBind = maxEnabled && !!pendingIdentification && !pendingIdentification.maxAvailable

  useEffect(() => {
    if (!needsMaxBind) {
      setBindUrl(undefined)
      return
    }
    let cancelled = false
    void fetchMaxBindLink().then((result) => {
      if (cancelled) return
      if (typeof result === 'string') {
        setError(result)
        return
      }
      setBindUrl(result.url)
    })
    return () => {
      cancelled = true
    }
  }, [needsMaxBind, fetchMaxBindLink])

  useEffect(() => {
    if (!needsMaxBind) return
    const id = window.setInterval(() => {
      void refreshPendingIdentification()
    }, 4000)
    return () => window.clearInterval(id)
  }, [needsMaxBind, refreshPendingIdentification])

  if (!pendingIdentification) {
    return <Navigate to={paths.loginStudent} replace />
  }

  const showMax = maxEnabled
  const maxBound = pendingIdentification.maxAvailable
  const emailDisabled = !pendingIdentification.emailAvailable
  const maxDisabled = !maxBound

  const handleCheckBind = async () => {
    setError(undefined)
    setCheckBusy(true)
    const result = await refreshPendingIdentification()
    setCheckBusy(false)
    if (result) {
      setError(result)
      return
    }
    const updated = useAuth.getState().pendingIdentification
    if (!updated?.maxAvailable) {
      setError('Привязка ещё не найдена. Откройте ссылку в MAX и нажмите «Начать».')
    } else {
      setChannel('MAX')
    }
  }

  const handleOpenBind = () => {
    if (!bindUrl) return
    setBindBusy(true)
    window.open(bindUrl, '_blank', 'noopener,noreferrer')
    setBindBusy(false)
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(undefined)

    if (channel === 'MAX' && maxDisabled) {
      setError('Сначала привяжите MAX через бота')
      return
    }
    if (channel === 'EMAIL' && emailDisabled) {
      setError('Отправка на email недоступна')
      return
    }

    setBusy(true)
    const result = await sendLoginCode(channel)
    setBusy(false)

    if (result) {
      setError(result)
      return
    }

    navigate(paths.verify)
  }

  return (
    <AuthCard>
      <p className={card.sectionLabel}>Куда отправить код</p>
      <p className={form.hint}>Выберите способ получения кода.</p>

      <form className={form.form} onSubmit={(e) => void handleSubmit(e)}>
        <LoginChannelPicker
          value={channel}
          onChange={setChannel}
          disabled={busy}
          emailHint={pendingIdentification.maskedEmail}
          phoneHint={
            maxBound
              ? 'Код придёт в чат с ботом'
              : 'Нужна привязка к боту'
          }
          emailDisabled={emailDisabled}
          maxDisabled={maxDisabled}
          showMax={showMax}
          hideLabel
        />

        {needsMaxBind && (
          <div className={form.bindBox}>
            <p className={form.hint}>
              Чтобы получать код в MAX, один раз откройте бота и нажмите «Начать».
            </p>
            <Button
              type="button"
              fullWidth
              size="lg"
              variant="secondary"
              loading={bindBusy}
              disabled={!bindUrl}
              onClick={handleOpenBind}
            >
              Открыть бота в MAX
            </Button>
            <Button
              type="button"
              fullWidth
              size="lg"
              variant="ghost"
              loading={checkBusy}
              onClick={() => void handleCheckBind()}
            >
              Я привязал — проверить
            </Button>
          </div>
        )}

        {error && <p className={form.error}>{error}</p>}

        <Button type="submit" fullWidth size="lg" loading={busy} disabled={channel === 'MAX' && maxDisabled}>
          Отправить код
        </Button>
      </form>

      <p className={card.forgotRow}>
        <Link to={paths.loginStudent}>Другой номер зачётки</Link>
      </p>
    </AuthCard>
  )
}
