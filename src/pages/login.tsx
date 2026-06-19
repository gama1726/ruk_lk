/**
 * @file Страница входа студента.
 */

import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth'
import { paths } from '@/paths'
import { AuthCard } from '@/blocks/auth-card'
import card from '@/blocks/auth-card.module.css'
import { LoginRoleLinks } from '@/blocks/login-role-links'
import { Input, Button } from '@/ui'
import styles from './auth-form.module.css'

export function Login() {
  const navigate = useNavigate()
  const signIn = useAuth((s) => s.signIn)
  const [loginError, setLoginError] = useState<string>()
  const [passwordError, setPasswordError] = useState<string>()
  const [busy, setBusy] = useState(false)

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoginError(undefined)
    setPasswordError(undefined)

    const form = new FormData(e.currentTarget)
    const email = String(form.get('login') ?? '')
    const password = String(form.get('password') ?? '')

    const result = signIn(email, password)

    if (result) {
      if (result.field === 'login') setLoginError(result.message)
      if (result.field === 'password') setPasswordError(result.message)
      return
    }

    setBusy(true)
    navigate(paths.verify)
  }

  return (
    <>
      <AuthCard>
        <p className={card.sectionLabel}>Вход для студента</p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <Input
            label="Почта или логин"
            type="email"
            name="login"
            autoComplete="username"
            placeholder="ivanov.as@student.ruc.local"
            error={loginError}
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
          <Button type="submit" fullWidth loading={busy} size="lg">
            Войти
          </Button>
        </form>

        <p className={card.forgotRow}>
          <Link to={paths.forgot}>Забыли пароль?</Link>
        </p>

        <p className={card.divider}>Или продолжите как</p>
        <LoginRoleLinks />
      </AuthCard>
    </>
  )
}
