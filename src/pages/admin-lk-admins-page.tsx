/**
 * @file Список и создание учёток админ-панели ЛК.
 */

import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { ApiError } from '@/apiClient'
import {
  createLkAdmin,
  LK_ADMIN_SECTION_LABELS,
  listLkAdmins,
  updateLkAdmin,
  type LkAdminSection,
  type LkAdminUser,
} from '@/lk-admin'
import { Button, Loader, LoadError } from '@/ui'
import styles from './admin-events.module.css'

const ALL_SECTIONS: LkAdminSection[] = ['ATTENDANCE', 'ADMINS']

function formatCreatedAt(value: string): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function AdminLkAdminsPage() {
  const [items, setItems] = useState<LkAdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [sections, setSections] = useState<LkAdminSection[]>(['ATTENDANCE'])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setItems(await listLkAdmins())
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось загрузить список')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const toggleSection = (section: LkAdminSection) => {
    setSections((prev) =>
      prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section],
    )
  }

  const onCreate = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setFormError(null)
    try {
      await createLkAdmin({
        fullName: fullName.trim(),
        username: username.trim(),
        password,
        sections,
      })
      setFullName('')
      setUsername('')
      setPassword('')
      setSections(['ATTENDANCE'])
      await load()
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Не удалось создать учётку')
    } finally {
      setBusy(false)
    }
  }

  const onToggleActive = async (user: LkAdminUser) => {
    if (user.superAdmin) return
    setBusy(true)
    setFormError(null)
    try {
      await updateLkAdmin(user.id, { active: !user.active })
      await load()
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Не удалось обновить учётку')
    } finally {
      setBusy(false)
    }
  }

  if (loading && items.length === 0) {
    return <Loader />
  }

  if (error && items.length === 0) {
    return <LoadError message={error} onRetry={() => void load()} />
  }

  return (
    <section aria-label="Учётки админ-панели">
      <div className={styles.toolbar}>
        <h1 className={styles.pageTitle}>Учётки админки</h1>
      </div>

      <div className={styles.card} style={{ marginBottom: '1.25rem' }}>
        <h2 className={styles.cardTitle}>Новая учётка</h2>
        <p className={styles.cardMeta}>ФИО, логин, пароль и доступ к разделам галочками.</p>
        <form className={styles.formGrid} onSubmit={onCreate}>
          <label className={styles.label}>
            ФИО
            <input
              className={styles.input}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              autoComplete="name"
            />
          </label>
          <div className={styles.formRow}>
            <label className={styles.label}>
              Логин
              <input
                className={styles.input}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="off"
              />
            </label>
            <label className={styles.label}>
              Пароль
              <input
                className={styles.input}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </label>
          </div>
          <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
            <legend className={styles.cardMeta} style={{ marginBottom: '0.5rem' }}>
              Доступ к разделам
            </legend>
            <div className={styles.formGrid}>
              {ALL_SECTIONS.map((section) => (
                <label key={section} className={styles.checkRow}>
                  <input
                    type="checkbox"
                    checked={sections.includes(section)}
                    onChange={() => toggleSection(section)}
                  />
                  {LK_ADMIN_SECTION_LABELS[section]}
                </label>
              ))}
            </div>
          </fieldset>
          {formError ? <p className={styles.error}>{formError}</p> : null}
          <div className={styles.footerActions}>
            <Button type="submit" disabled={busy || sections.length === 0}>
              {busy ? 'Сохранение…' : 'Создать'}
            </Button>
          </div>
        </form>
      </div>

      <div className={styles.usersCard}>
        <h2 className={styles.chartTitle}>Все пользователи ({items.length})</h2>
        <div className={styles.usersTableWrap}>
          <table className={styles.usersTable}>
            <thead>
              <tr>
                <th>ФИО</th>
                <th>Логин</th>
                <th>Разделы</th>
                <th>Статус</th>
                <th>Создан</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((user) => (
                <tr key={user.id}>
                  <td>
                    {user.fullName}
                    {user.superAdmin ? ' · супер' : ''}
                  </td>
                  <td>{user.username}</td>
                  <td>
                    {user.sections.map((s) => LK_ADMIN_SECTION_LABELS[s] ?? s).join(', ') || '—'}
                  </td>
                  <td>
                    <span className={`${styles.badge} ${user.active ? styles.badgeOn : styles.badgeOff}`}>
                      {user.active ? 'Активна' : 'Отключена'}
                    </span>
                  </td>
                  <td>{formatCreatedAt(user.createdAt)}</td>
                  <td>
                    {!user.superAdmin ? (
                      <button
                        type="button"
                        className={styles.logoutBtn}
                        disabled={busy}
                        onClick={() => void onToggleActive(user)}
                      >
                        {user.active ? 'Отключить' : 'Включить'}
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
