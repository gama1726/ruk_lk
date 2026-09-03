/**
 * @file Вход в редактор календаря мероприятий.
 */

import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiError } from '@/apiClient'
import { eventsAdminLogin } from '@/events-admin'
import { paths } from '@/paths'
import { Button } from '@/ui'
import { AdminEventsShell } from '@/pages/admin-events-shell'
import styles from './admin-events.module.css'

export function AdminEventsLogin() {
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
      await eventsAdminLogin(username.trim(), password)
      navigate(paths.adminEvents, { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось войти')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AdminEventsShell pageSection="Вход">
      <div className={styles.loginWrap}>
        <h1 className={styles.loginHeroTitle}>Редактор календаря</h1>
        <p className={styles.loginHeroSub}>
          Войдите, чтобы добавлять и редактировать мероприятия для студентов и родителей.
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
    </AdminEventsShell>
  )
}
