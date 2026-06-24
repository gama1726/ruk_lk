/**
 * @file Вход студента по номеру зачётки и паролю (backend API).
 */

import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth'
import { paths } from '@/paths'
import { AuthCard } from '@/blocks/auth-card'
import card from '@/blocks/auth-card.module.css'
import { Input, Button } from '@/ui'
import form from './auth-form.module.css'

/**
 * Резервный вход: `POST /api/auth/login` с cookie-сессией.
 */
export function StudentLogin() {
  const navigate = useNavigate()
  const loginWithStudentId = useAuth((s) => s.loginWithStudentId)
  const [studentIdError, setStudentIdError] = useState<string>()
  const [passwordError, setPasswordError] = useState<string>()
  const [busy, setBusy] = useState(false)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setStudentIdError(undefined)
    setPasswordError(undefined)

    const data = new FormData(e.currentTarget)
    const studentId = String(data.get('studentId') ?? '')
    const password = String(data.get('password') ?? '')

    setBusy(true)
    const result = await loginWithStudentId(studentId, password)
    setBusy(false)

    if (result) {
      if (result.field === 'login') setStudentIdError(result.message)
      if (result.field === 'password') setPasswordError(result.message)
      return
    }

    navigate(paths.profile)
  }

  return (
    <AuthCard>
      <p className={card.sectionLabel}>Вход по номеру зачётки</p>

      <form className={form.form} onSubmit={(e) => void handleSubmit(e)}>
        <Input
          label="Номер зачётки"
          name="studentId"
          autoComplete="username"
          placeholder="172194"
          inputMode="numeric"
          error={studentIdError}
          disabled={busy}
        />
        <Input
          label="Пароль"
          type="password"
          name="password"
          autoComplete="current-password"
          error={passwordError}
          disabled={busy}
        />
        <Button type="submit" fullWidth size="lg" loading={busy}>
          Войти
        </Button>
      </form>

      <p className={card.forgotRow}>
        <Link to={paths.login}>Войти через SSO</Link>
      </p>
    </AuthCard>
  )
}
