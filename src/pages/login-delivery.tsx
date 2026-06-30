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
  const [channel, setChannel] = useState<LoginCodeChannel>('EMAIL')
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)
  const [maxEnabled, setMaxEnabled] = useState(false)

  useEffect(() => {
    void fetchLoginChannels().then((c) => setMaxEnabled(c.maxEnabled))
  }, [fetchLoginChannels])

  if (!pendingIdentification) {
    return <Navigate to={paths.loginStudent} replace />
  }

  const showMax = maxEnabled && pendingIdentification.maxAvailable
  const emailDisabled = !pendingIdentification.emailAvailable
  const maxDisabled = !showMax

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(undefined)

    if (channel === 'MAX' && maxDisabled) {
      setError('Вход через MAX недоступен')
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
          phoneHint={pendingIdentification.maskedPhone}
          emailDisabled={emailDisabled}
          maxDisabled={maxDisabled}
          showMax={showMax}
          hideLabel
        />

        {error && <p className={form.error}>{error}</p>}

        <Button type="submit" fullWidth size="lg" loading={busy}>
          Отправить код
        </Button>
      </form>

      <p className={card.forgotRow}>
        <Link to={paths.loginStudent}>Другой номер зачётки</Link>
      </p>
    </AuthCard>
  )
}
