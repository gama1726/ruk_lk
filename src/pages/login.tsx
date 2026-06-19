import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth'
import { paths } from '@/paths'
import { ScreenHeader, Card, Input, Button } from '@/ui'
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
      <ScreenHeader title="Вход" />
      <Card>
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
          <p className={styles.hint}>Для входа нужна корпоративная почта студента РУК.</p>
          <div className={styles.actions}>
            <Button type="submit" fullWidth loading={busy}>
              Войти
            </Button>
          </div>
        </form>
      </Card>
    </>
  )
}
