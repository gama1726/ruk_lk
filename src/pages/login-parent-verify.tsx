/**
 * @file Вход для родителя — шаг 3: код подтверждения.
 */

import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { paths } from '@/paths'
import { useParentAuth } from '@/parent-auth'
import { AuthCard } from '@/blocks/auth-card'
import card from '@/blocks/auth-card.module.css'
import { Input, Button } from '@/ui'
import form from './auth-form.module.css'
import pub from './public.module.css'

export function ParentLoginVerify() {
  const navigate = useNavigate()
  const pendingChallenge = useParentAuth((s) => s.pendingChallenge)
  const confirmCode = useParentAuth((s) => s.confirmCode)
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!pendingChallenge) {
      navigate(paths.loginParent, { replace: true })
    }
  }, [pendingChallenge, navigate])

  if (!pendingChallenge) {
    return null
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(undefined)
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

  return (
    <>
      <AuthCard>
        <p className={card.sectionLabel}>Код подтверждения</p>
        <p className={form.hint}>Код отправлен: {pendingChallenge.deliveryHint}</p>
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
      </AuthCard>
      <p className={pub.back}>
        <Link to={paths.loginParent}>Начать заново</Link>
      </p>
    </>
  )
}
