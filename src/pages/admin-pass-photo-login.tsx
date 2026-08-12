/**
 * @file Единый вход в админ-панель пропусков (СПО / ВО).
 */

import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiError } from '@/apiClient'
import { adminLogin, adminPassPhotoQueuePath } from '@/pass-photo'
import { Button } from '@/ui'
import { AdminPassPhotoShell } from '@/pages/admin-pass-photo-shell'
import styles from './admin-pass-photos.module.css'

export function AdminPassPhotoLogin() {
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
      const me = await adminLogin(username.trim(), password)
      navigate(adminPassPhotoQueuePath(me.role), { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось войти')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AdminPassPhotoShell pageSection="Вход">
      <div className={styles.loginWrap}>
        <div className={styles.loginHero}>
          <h1 className={styles.loginHeroTitle}>Вход для сотрудника</h1>
          <p className={styles.loginHeroSub}>
            Одна форма для сотрудников СПО и высшего образования — после входа откроется ваша очередь.
          </p>
        </div>

        <div className={styles.authCard}>
          <form className={styles.authForm} onSubmit={onLogin}>
            <label className={styles.label}>
              Логин
              <input
                className={styles.input}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                placeholder="admin-spo или admin-vo"
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
              {busy ? 'Вход…' : 'Войти в админ-панель'}
            </Button>
          </form>
        </div>
      </div>
    </AdminPassPhotoShell>
  )
}
