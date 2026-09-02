/**
 * @file Вход для родителя — шаг 3: выбор канала (email / MAX).
 */

import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth, type LoginCodeChannel } from '@/auth'
import { useParentAuth } from '@/parent-auth'
import { paths } from '@/paths'
import { LoginChannelPicker } from '@/blocks/login-channel-picker'
import { AuthCard } from '@/blocks/auth-card'
import card from '@/blocks/auth-card.module.css'
import { Button } from '@/ui'
import form from './auth-form.module.css'
import pub from './public.module.css'

export function ParentLoginDelivery() {
  const navigate = useNavigate()
  const pendingDelivery = useParentAuth((s) => s.pendingDelivery)
  const sendLoginCode = useParentAuth((s) => s.sendLoginCode)
  const fetchLoginChannels = useAuth((s) => s.fetchLoginChannels)
  const fetchMaxBindLink = useParentAuth((s) => s.fetchMaxBindLink)
  const refreshPendingDelivery = useParentAuth((s) => s.refreshPendingDelivery)
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

  const needsMaxBind = maxEnabled && !!pendingDelivery && !pendingDelivery.maxAvailable && !!pendingDelivery.maskedPhone

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
      void refreshPendingDelivery()
    }, 4000)
    return () => window.clearInterval(id)
  }, [needsMaxBind, refreshPendingDelivery])

  useEffect(() => {
    if (!pendingDelivery) return
    if (pendingDelivery.emailAvailable) {
      setChannel('EMAIL')
    } else if (pendingDelivery.maxAvailable) {
      setChannel('MAX')
    } else if (needsMaxBind) {
      setChannel('MAX')
    }
  }, [pendingDelivery, needsMaxBind])

  if (!pendingDelivery) {
    return <Navigate to={paths.loginParent} replace />
  }

  const showMax = maxEnabled && (!!pendingDelivery.maskedPhone || pendingDelivery.maxAvailable)
  const maxBound = pendingDelivery.maxAvailable
  const maxPhoneChanged = pendingDelivery.maxPhoneChanged
  const emailDisabled = !pendingDelivery.emailAvailable
  const maxDisabled = !maxBound

  const handleCheckBind = async () => {
    setError(undefined)
    setCheckBusy(true)
    const result = await refreshPendingDelivery()
    setCheckBusy(false)
    if (result) {
      setError(result)
      return
    }
    const updated = useParentAuth.getState().pendingDelivery
    if (!updated?.maxAvailable) {
      setError(
        'Привязка ещё не найдена. Откройте ссылку в MAX, нажмите «Начать» и «Поделиться номером».'
      )
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

    if (!pendingDelivery.canSendCode) {
      setError('Для входа не указаны email и телефон в базе университета. Обратитесь в деканат.')
      return
    }

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
      if (channel === 'MAX') {
        await refreshPendingDelivery()
        const updated = useParentAuth.getState().pendingDelivery
        if (updated?.maxPhoneChanged) {
          setError(undefined)
          return
        }
      }
      setError(result)
      return
    }

    navigate(paths.loginParentVerify)
  }

  return (
    <>
      <AuthCard>
        <p className={card.sectionLabel}>Куда отправить код</p>
        <p className={form.hint}>Выберите способ получения кода.</p>

        <form className={form.form} onSubmit={(e) => void handleSubmit(e)}>
          <LoginChannelPicker
            value={channel}
            onChange={setChannel}
            disabled={busy || !pendingDelivery.canSendCode}
            emailHint={pendingDelivery.maskedEmail ?? undefined}
            phoneHint={maxBound ? 'Код придёт в чат с ботом' : 'Нужна привязка к боту'}
            emailDisabled={emailDisabled}
            maxDisabled={maxDisabled}
            showMax={showMax}
            hideLabel
          />

          {needsMaxBind && maxPhoneChanged && (
            <p className={form.error}>
              Номер телефона в базе университета изменился. Привяжите MAX заново, чтобы получать коды
              входа.
            </p>
          )}

          {needsMaxBind && (
            <div className={form.bindBox}>
              <p className={form.hint}>
                {maxPhoneChanged
                  ? 'Номер в MAX должен совпадать с актуальным телефоном из базы университета'
                  : 'Чтобы получать код в MAX, один раз привяжите аккаунт к боту. Номер в MAX должен совпадать с телефоном из базы университета'}
                {pendingDelivery.maskedPhone ? ` (${pendingDelivery.maskedPhone})` : ''}.
              </p>
              <ol className={form.bindSteps}>
                <li>Нажмите «Открыть бота в MAX» и в профиле бота — «Начать».</li>
                <li>В чате нажмите «Поделиться номером» — MAX отправит номер, привязанный к аккаунту.</li>
                <li>Вернитесь сюда и нажмите «Я привязал — проверить».</li>
              </ol>
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

          <Button
            type="submit"
            fullWidth
            size="lg"
            loading={busy}
            disabled={!pendingDelivery.canSendCode || (channel === 'MAX' && maxDisabled)}
          >
            Отправить код
          </Button>
        </form>

        <p className={card.forgotRow}>
          <Link to={paths.loginParentSelect}>Назад</Link>
        </p>
      </AuthCard>
      <p className={pub.back}>
        <Link to={paths.loginParent}>Начать заново</Link>
      </p>
    </>
  )
}
