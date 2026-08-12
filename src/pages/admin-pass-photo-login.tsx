/**
 * @file Вход в админку пропусков (СПО / ВО).
 */

import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError } from '@/apiClient'
import {
  adminLogin,
  educationTrackLabel,
  type EducationTrack,
} from '@/pass-photo'
import { paths } from '@/paths'
import { Button } from '@/ui'
import { AdminPassPhotoShell } from '@/pages/admin-pass-photo-shell'
import styles from './admin-pass-photos.module.css'

type Props = {
  expectedRole: EducationTrack
}

export function AdminPassPhotoLogin({ expectedRole }: Props) {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const queuePath =
    expectedRole === 'SPO' ? paths.adminPassPhotosSpo : paths.adminPassPhotosHe

  const onLogin = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const me = await adminLogin(username.trim(), password)
      if (me.role !== expectedRole) {
        setError(`Эта учётка для «${educationTrackLabel[me.role]}», откройте соответствующий вход.`)
        return
      }
      navigate(queuePath, { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось войти')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AdminPassPhotoShell track={expectedRole}>
      <div className={styles.loginWrap}>
        <div className={styles.loginHero}>
          <h1 className={styles.loginHeroTitle}>Вход для сотрудника</h1>
          <p className={styles.loginHeroSub}>
            Очередь заявок на фото для пропуска —{' '}
            <strong>{educationTrackLabel[expectedRole]}</strong>
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
                placeholder="admin-spo"
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
              {busy ? 'Вход…' : 'Войти в админку'}
            </Button>
          </form>

          <p className={styles.switchTrack}>
            {expectedRole === 'SPO' ? (
              <>
                Работаете с высшим образованием?{' '}
                <Link to={paths.adminPassPhotosHeLogin}>Вход для ВО</Link>
              </>
            ) : (
              <>
                Работаете с СПО? <Link to={paths.adminPassPhotosSpoLogin}>Вход для СПО</Link>
              </>
            )}
          </p>
        </div>
      </div>
    </AdminPassPhotoShell>
  )
}
