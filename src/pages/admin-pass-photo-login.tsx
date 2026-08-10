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
import { Button, Card, ScreenHeader } from '@/ui'
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
    <div className={styles.page}>
      <ScreenHeader
        title={`Админка пропусков — ${educationTrackLabel[expectedRole]}`}
        subtitle="Вход для сотрудника"
      />
      <Card padding="md" className={styles.authCard}>
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
          <Button type="submit" disabled={busy}>
            {busy ? 'Вход…' : 'Войти'}
          </Button>
        </form>

        <p className={styles.switchTrack}>
          {expectedRole === 'SPO' ? (
            <Link to={paths.adminPassPhotosHeLogin}>Вход для высшего образования</Link>
          ) : (
            <Link to={paths.adminPassPhotosSpoLogin}>Вход для СПО</Link>
          )}
        </p>
      </Card>
    </div>
  )
}
