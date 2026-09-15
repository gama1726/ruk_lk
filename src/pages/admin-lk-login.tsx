/**
 * @file Вход в административную панель ЛК.
 */

import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiError } from '@/apiClient'
import { firstAllowedLkPath, lkAdminLogin } from '@/lk-admin'
import { Button } from '@/ui'
import { AdminLkShell } from '@/pages/admin-lk-shell'
import styles from './admin-events.module.css'

export function AdminLkLogin() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const onLogin = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const me = await lkAdminLogin(username.trim(), password)
      navigate(firstAllowedLkPath(me), { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось войти')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AdminLkShell pageSection="Вход">
      <div className={styles.loginWrap}>
        <h1 className={styles.loginHeroTitle}>Админ-панель ЛК</h1>
        <p className={styles.loginHeroSub}>
          Войдите, чтобы просматривать посещаемость и управлять учётками администраторов.
        </p>
        <div className={styles.authCard}>
          <form className={styles.authForm} onSubmit={onLogin}>
            <label className={styles.label}>
              Логин
              <input
                className={styles.input}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </label>
            <label className={styles.label}>
              Пароль
              <input
                className={styles.input}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </label>
            {error && <p className={styles.error}>{error}</p>}
            <Button type="submit" disabled={busy} fullWidth>
              {busy ? 'Вход…' : 'Войти'}
            </Button>
          </form>
        </div>
      </div>
    </AdminLkShell>
  )
}
