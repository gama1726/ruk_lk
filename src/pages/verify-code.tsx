import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { maskEmail, useAuth } from '@/auth'
import { paths } from '@/paths'
import { AuthCard } from '@/blocks/auth-card'
import card from '@/blocks/auth-card.module.css'
import { Input, Button } from '@/ui'
import styles from './auth-form.module.css'

export function Verify() {
  const navigate = useNavigate()
  const pendingEmail = useAuth((s) => s.pendingEmail)
  const confirmCode = useAuth((s) => s.confirmCode)
  const [codeError, setCodeError] = useState<string>()
  const [busy, setBusy] = useState(false)

  if (!pendingEmail) {
    return <Navigate to={paths.loginStudent} replace />
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setCodeError(undefined)

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

  return (
    <AuthCard>
      <p className={card.sectionLabel}>Подтверждение входа</p>
      <form className={styles.form} onSubmit={(e) => void handleSubmit(e)}>
        <p className={styles.hint}>
          Код отправлен на <strong>{maskEmail(pendingEmail)}</strong>. Проверьте входящие и папку «Спам».
        </p>
        <Input
          label="Код из письма"
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
    </AuthCard>
  )
}
