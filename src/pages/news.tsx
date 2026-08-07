/**
 * @file Новости университета (new.ruc.su/blog).
 */

import { useEffect, useState } from 'react'
import { ApiError } from '@/apiClient'
import { fetchStudentNews, isNewsApiEnabled, type StudentNewsItemDto } from '@/news'
import { useReadState } from '@/notice-read'
import { ScreenHeader, Badge, NoData, Button } from '@/ui'
import styles from './news.module.css'

function formatNewsDate(iso: string): string {
  if (!iso) return ''
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).format(
    new Date(y, m - 1, d),
  )
}

/**
 * Лента новостей с сайта университета.
 */
export function News() {
  const apiEnabled = isNewsApiEnabled()
  const [items, setItems] = useState<StudentNewsItemDto[]>([])
  const [loading, setLoading] = useState(apiEnabled)
  const [error, setError] = useState<string | null>(null)
  const [unavailable, setUnavailable] = useState(false)
  const isRead = useReadState((s) => s.isRead)
  const setRead = useReadState((s) => s.setRead)

  useEffect(() => {
    if (!apiEnabled) {
      setLoading(false)
      setUnavailable(true)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchStudentNews()
      .then((dto) => {
        if (cancelled) return
        if (dto.status === 'unavailable') {
          setUnavailable(true)
          setItems([])
          return
        }
        setUnavailable(false)
        setItems([...dto.items].sort((a, b) => (b.date || '').localeCompare(a.date || '')))
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof ApiError ? err.message : 'Не удалось загрузить новости')
        setItems([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [apiEnabled])

  return (
    <>
      <ScreenHeader title="Новости" subtitle="Объявления с сайта университета" />

      {loading && <p className={styles.meta}>Загрузка…</p>}
      {error && <p className={styles.meta}>{error}</p>}
      {!loading && !error && unavailable && (
        <p className={styles.meta}>Новости временно недоступны.</p>
      )}

      {!loading && !error && !unavailable && items.length === 0 ? (
        <NoData title="Нет новостей" description="Лента пока пуста." />
      ) : null}

      {!loading && !error && items.length > 0 ? (
        <ul className={styles.list}>
          {items.map((n) => {
            const read = isRead(n.id)
            return (
              <li
                key={n.id}
                className={[styles.item, !read ? styles.itemUnread : ''].filter(Boolean).join(' ')}
              >
                {n.imageUrl ? (
                  <a
                    href={n.url}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.coverLink}
                    onClick={() => setRead(n.id, true)}
                  >
                    <img src={n.imageUrl} alt="" className={styles.cover} loading="lazy" />
                  </a>
                ) : null}
                <div className={styles.itemHead}>
                  <h2 className={styles.title}>
                    <a
                      href={n.url}
                      target="_blank"
                      rel="noreferrer"
                      className={styles.titleLink}
                      onClick={() => setRead(n.id, true)}
                    >
                      {n.title}
                    </a>
                  </h2>
                  {!read ? <Badge variant="primary">новое</Badge> : null}
                </div>
                {n.date ? <p className={styles.meta}>{formatNewsDate(n.date)}</p> : null}
                {n.preview ? <p className={styles.preview}>{n.preview}</p> : null}
                <div className={styles.actions}>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setRead(n.id, true)
                      window.open(n.url, '_blank', 'noopener,noreferrer')
                    }}
                  >
                    Читать на сайте
                  </Button>
                  <button
                    type="button"
                    className={styles.markBtn}
                    onClick={() => setRead(n.id, !read)}
                  >
                    {read ? 'Пометить непрочитанным' : 'Пометить прочитанным'}
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      ) : null}
    </>
  )
}
