/**
 * @file Mock-страница SSO (Keycloak) для демо без реального IdP.
 * @remarks В проде кнопка «Войти через SSO» уводит на {@link import.meta.env.VITE_SSO_URL}.
 */

import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth'
import { paths } from '@/paths'
import { Input, Button } from '@/ui'
import styles from './login-sso.module.css'

/**
 * Форма входа провайдера идентификации — аналог sso.mirea.ru (Keycloak).
 */
export function SsoLogin() {
  const navigate = useNavigate()
  const completeSso = useAuth((s) => s.completeSso)
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
    const result = completeSso(email, password)

    if (result) {
      if (result.field === 'login') setLoginError(result.message)
      if (result.field === 'password') setPasswordError(result.message)
      return
    }

    setBusy(true)
    navigate(paths.profile)
  }

  return (
    <>
      <h1 className={styles.title}>Вход в систему аутентификации (dev)</h1>
      <p className={styles.realm}>Российский университет кооперации</p>

      <form className={styles.form} onSubmit={handleSubmit}>
        <Input
          label="Имя пользователя или E-mail"
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

      <p className={styles.hint}>
        Демо-режим: любая корректная почта и пароль от 4 символов.
        {' '}
        <Link to={paths.loginStudent}>Войти по номеру зачётки</Link>
      </p>
    </>
  )
}
