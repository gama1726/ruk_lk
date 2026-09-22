/**
 * @file Список, создание и правка доступов учёток админ-панели ЛК.
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

const ALL_SECTIONS: LkAdminSection[] = [
  'ATTENDANCE',
  'ABSENCE_REPORT',
  'EVENTS',
  'API_LOAD',
  'CABINET_STATS',
  'ADMINS',
]

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

function SectionCheckboxes({
  value,
  onChange,
  disabled,
}: {
  value: LkAdminSection[]
  onChange: (next: LkAdminSection[]) => void
  disabled?: boolean
}) {
  const toggle = (section: LkAdminSection) => {
    onChange(
      value.includes(section) ? value.filter((s) => s !== section) : [...value, section],
    )
  }
  return (
    <fieldset style={{ border: 0, margin: 0, padding: 0 }} disabled={disabled}>
      <legend className={styles.cardMeta} style={{ marginBottom: '0.5rem' }}>
        Доступ к разделам
      </legend>
      <div className={styles.formGrid}>
        {ALL_SECTIONS.map((section) => (
          <label key={section} className={styles.checkRow}>
            <input
              type="checkbox"
              checked={value.includes(section)}
              onChange={() => toggle(section)}
            />
            {LK_ADMIN_SECTION_LABELS[section]}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

export function AdminLkAdminsPage() {
  const [items, setItems] = useState<LkAdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [editError, setEditError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [sections, setSections] = useState<LkAdminSection[]>(['ATTENDANCE'])

  const [editing, setEditing] = useState<LkAdminUser | null>(null)
  const [editFullName, setEditFullName] = useState('')
  const [editPassword, setEditPassword] = useState('')
  const [editSections, setEditSections] = useState<LkAdminSection[]>([])

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

  const openEdit = (user: LkAdminUser) => {
    if (user.superAdmin) return
    setEditError(null)
    setEditing(user)
    setEditFullName(user.fullName)
    setEditPassword('')
    setEditSections([...user.sections])
  }

  const closeEdit = () => {
    setEditing(null)
    setEditError(null)
    setEditPassword('')
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

  const onSaveEdit = async (e: FormEvent) => {
    e.preventDefault()
    if (!editing) return
    if (editSections.length === 0) {
      setEditError('Выберите хотя бы один раздел')
      return
    }
    setBusy(true)
    setEditError(null)
    try {
      await updateLkAdmin(editing.id, {
        fullName: editFullName.trim(),
        sections: editSections,
        ...(editPassword.trim() ? { password: editPassword.trim() } : {}),
      })
      closeEdit()
      await load()
    } catch (err) {
      setEditError(err instanceof ApiError ? err.message : 'Не удалось сохранить изменения')
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
          <SectionCheckboxes value={sections} onChange={setSections} disabled={busy} />
          {formError ? <p className={styles.error}>{formError}</p> : null}
          <div className={styles.footerActions}>
            <Button type="submit" disabled={busy || sections.length === 0}>
              {busy ? 'Сохранение…' : 'Создать'}
            </Button>
          </div>
        </form>
      </div>

      {editing ? (
        <div className={styles.card} style={{ marginBottom: '1.25rem' }}>
          <h2 className={styles.cardTitle}>Права: {editing.username}</h2>
          <p className={styles.cardMeta}>
            Можно изменить ФИО, доступы к разделам и пароль. Логин не меняется.
          </p>
          <form className={styles.formGrid} onSubmit={onSaveEdit}>
            <label className={styles.label}>
              ФИО
              <input
                className={styles.input}
                value={editFullName}
                onChange={(e) => setEditFullName(e.target.value)}
                required
                autoComplete="name"
              />
            </label>
            <label className={styles.label}>
              Новый пароль (необязательно)
              <input
                className={styles.input}
                type="password"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                minLength={6}
                autoComplete="new-password"
                placeholder="Оставьте пустым, чтобы не менять"
              />
            </label>
            <SectionCheckboxes value={editSections} onChange={setEditSections} disabled={busy} />
            {editError ? <p className={styles.error}>{editError}</p> : null}
            <div className={styles.footerActions}>
              <Button type="button" disabled={busy} onClick={closeEdit}>
                Отмена
              </Button>
              <Button type="submit" disabled={busy || editSections.length === 0}>
                {busy ? 'Сохранение…' : 'Сохранить'}
              </Button>
            </div>
          </form>
        </div>
      ) : null}

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
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <button
                          type="button"
                          className={styles.logoutBtn}
                          disabled={busy}
                          onClick={() => openEdit(user)}
                        >
                          Доступы
                        </button>
                        <button
                          type="button"
                          className={styles.logoutBtn}
                          disabled={busy}
                          onClick={() => void onToggleActive(user)}
                        >
                          {user.active ? 'Отключить' : 'Включить'}
                        </button>
                      </div>
                    ) : (
                      <span className={styles.cardMeta}>все разделы</span>
                    )}
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
