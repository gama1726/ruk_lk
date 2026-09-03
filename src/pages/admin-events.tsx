/**
 * @file CRUD мероприятий в админке календаря.
 */

import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiError } from '@/apiClient'
import type { CampusEventDto } from '@/events'
import {
  createAdminEvent,
  deleteAdminEvent,
  eventsAdminLogout,
  eventsAdminMe,
  listAdminEvents,
  updateAdminEvent,
  type CampusEventWrite,
} from '@/events-admin'
import { paths } from '@/paths'
import { Button, Input, Loader, LoadError, Modal, NoData, Textarea } from '@/ui'
import { AdminEventsShell } from '@/pages/admin-events-shell'
import styles from './admin-events.module.css'

type Draft = {
  title: string
  description: string
  startDate: string
  endDate: string
  published: boolean
}

const emptyDraft = (): Draft => ({
  title: '',
  description: '',
  startDate: '',
  endDate: '',
  published: true,
})

function formatRange(start: string, end: string): string {
  if (start === end) return start
  return `${start} — ${end}`
}

export function AdminEventsPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState<string>()
  const [items, setItems] = useState<CampusEventDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<CampusEventDto | null>(null)
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const me = await eventsAdminMe()
      setUsername(me.username)
      setItems(await listAdminEvents())
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        navigate(paths.adminEventsLogin, { replace: true })
        return
      }
      setError(err instanceof ApiError ? err.message : 'Не удалось загрузить мероприятия')
    } finally {
      setLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    void load()
  }, [load])

  const openCreate = () => {
    setEditing(null)
    setDraft(emptyDraft())
    setFormError(null)
    setModalOpen(true)
  }

  const openEdit = (item: CampusEventDto) => {
    setEditing(item)
    setDraft({
      title: item.title,
      description: item.description ?? '',
      startDate: item.startDate,
      endDate: item.endDate,
      published: item.published,
    })
    setFormError(null)
    setModalOpen(true)
  }

  const onLogout = async () => {
    try {
      await eventsAdminLogout()
    } catch {
      /* ignore */
    }
    navigate(paths.adminEventsLogin, { replace: true })
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setFormError(null)
    const body: CampusEventWrite = {
      title: draft.title.trim(),
      description: draft.description.trim(),
      startDate: draft.startDate,
      endDate: draft.endDate || draft.startDate,
      published: draft.published,
    }
    try {
      if (editing) {
        await updateAdminEvent(editing.id, body)
      } else {
        await createAdminEvent(body)
      }
      setModalOpen(false)
      await load()
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Не удалось сохранить')
    } finally {
      setSaving(false)
    }
  }

  const onDelete = async (item: CampusEventDto) => {
    if (!window.confirm(`Удалить «${item.title}»?`)) return
    try {
      await deleteAdminEvent(item.id)
      await load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось удалить')
    }
  }

  return (
    <AdminEventsShell pageSection="Список" username={username} onLogout={() => void onLogout()}>
      <div className={styles.toolbar}>
        <h1 className={styles.pageTitle}>Мероприятия</h1>
        <Button type="button" onClick={openCreate}>
          Добавить
        </Button>
      </div>

      {loading ? <Loader /> : null}
      {!loading && error ? <LoadError message={error} onRetry={() => void load()} /> : null}
      {!loading && !error && items.length === 0 ? (
        <NoData title="Пока нет мероприятий" description="Добавьте первое событие для календаря." />
      ) : null}

      {!loading && !error && items.length > 0 ? (
        <div className={styles.list}>
          {items.map((item) => (
            <article key={item.id} className={styles.card}>
              <div className={styles.cardTop}>
                <div>
                  <h2 className={styles.cardTitle}>{item.title}</h2>
                  <p className={styles.cardMeta}>{formatRange(item.startDate, item.endDate)}</p>
                </div>
                <span className={`${styles.badge} ${item.published ? styles.badgeOn : styles.badgeOff}`}>
                  {item.published ? 'Опубликовано' : 'Черновик'}
                </span>
              </div>
              {item.description ? <p className={styles.cardDesc}>{item.description}</p> : null}
              <div className={styles.cardActions}>
                <Button type="button" variant="secondary" onClick={() => openEdit(item)}>
                  Изменить
                </Button>
                <Button type="button" variant="secondary" onClick={() => void onDelete(item)}>
                  Удалить
                </Button>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      <Modal
        open={modalOpen}
        title={editing ? 'Редактировать мероприятие' : 'Новое мероприятие'}
        onClose={() => setModalOpen(false)}
        footer={
          <div className={styles.footerActions}>
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>
              Отмена
            </Button>
            <Button type="submit" form="event-form" disabled={saving}>
              {saving ? 'Сохранение…' : 'Сохранить'}
            </Button>
          </div>
        }
      >
        <form id="event-form" className={styles.formGrid} onSubmit={(e) => void onSubmit(e)}>
          <label className={styles.label}>
            Название
            <Input
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              required
              maxLength={300}
            />
          </label>
          <label className={styles.label}>
            Описание
            <Textarea
              value={draft.description}
              onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
              rows={4}
              maxLength={4000}
            />
          </label>
          <div className={styles.formRow}>
            <label className={styles.label}>
              Дата начала
              <Input
                type="date"
                value={draft.startDate}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    startDate: e.target.value,
                    endDate: d.endDate || e.target.value,
                  }))
                }
                required
              />
            </label>
            <label className={styles.label}>
              Дата окончания
              <Input
                type="date"
                value={draft.endDate}
                onChange={(e) => setDraft((d) => ({ ...d, endDate: e.target.value }))}
                required
              />
            </label>
          </div>
          <label className={styles.checkRow}>
            <input
              type="checkbox"
              checked={draft.published}
              onChange={(e) => setDraft((d) => ({ ...d, published: e.target.checked }))}
            />
            Опубликовать в кабинетах
          </label>
          {formError ? <p className={styles.error}>{formError}</p> : null}
        </form>
      </Modal>
    </AdminEventsShell>
  )
}
