/**
 * @file Вход по зачётке и паролю — шаг 1 перед кодом на почту из 1С.
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
 * Зачётка + пароль → {@link paths.verify}.
 */
export function StudentLogin() {
  const navigate = useNavigate()
  const startStudentLogin = useAuth((s) => s.startStudentLogin)
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
    const result = await startStudentLogin(studentId, password)
    setBusy(false)

    if (result) {
      if (result.field === 'login') setStudentIdError(result.message)
      if (result.field === 'password') setPasswordError(result.message)
      return
    }

    navigate(paths.verify)
  }

  return (
    <AuthCard>
      <p className={card.sectionLabel}>Вход по номеру зачётки</p>
      <p className={form.hint}>После проверки пароля отправим код на почту, привязанную в 1С.</p>

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
          Продолжить
        </Button>
      </form>

      <p className={card.forgotRow}>
        <Link to={paths.login}>Войти через SSO</Link>
      </p>
    </AuthCard>
  )
}
