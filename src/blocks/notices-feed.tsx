import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchStudentNews, isNewsApiEnabled, type StudentNewsItemDto } from '@/news'
import { countUnread, useReadState } from '@/notice-read'
import { paths } from '@/paths'
import { Card, Badge } from '@/ui'
import styles from './home.module.css'

/**
 * Свежие новости университета на главной.
 */
export function NoticesFeed() {
  const apiEnabled = isNewsApiEnabled()
  const overrides = useReadState((s) => s.overrides)
  const setRead = useReadState((s) => s.setRead)
  const [items, setItems] = useState<StudentNewsItemDto[]>([])

  useEffect(() => {
    if (!apiEnabled) return
    let cancelled = false
    fetchStudentNews()
      .then((dto) => {
        if (cancelled || dto.status === 'unavailable') return
        setItems([...dto.items].sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 3))
      })
      .catch(() => {
        if (!cancelled) setItems([])
      })
    return () => {
      cancelled = true
    }
  }, [apiEnabled])

  const unread = useMemo(
    () => countUnread(items.map((i) => i.id), overrides),
    [items, overrides],
  )

  if (!apiEnabled) {
    return (
      <Card title="Новости">
        <p className={styles.note}>Подключите API, чтобы видеть новости университета.</p>
        <p className={styles.note}>
          <Link to={paths.news}>Открыть раздел</Link>
        </p>
      </Card>
    )
  }

  return (
    <Card title="Новости">
      {unread > 0 ? (
        <p className={styles.note}>
          <Badge variant="primary">{unread} непрочитанное</Badge>
        </p>
      ) : null}
      {items.length === 0 ? (
        <p className={styles.note}>Пока нет новостей.</p>
      ) : (
        <ul className={styles.noticeList}>
          {items.map((n) => (
            <li
              key={n.id}
              className={[styles.noticeItem, !overrides[n.id] ? styles.noticeItemUnread : '']
                .filter(Boolean)
                .join(' ')}
            >
              <a
                href={n.url}
                target="_blank"
                rel="noreferrer"
                className={styles.noticeLink}
                onClick={() => setRead(n.id, true)}
              >
                <div className={styles.noticeTitle}>{n.title}</div>
                <div className={styles.noticePreview}>{n.date || 'Университет'}</div>
              </a>
            </li>
          ))}
        </ul>
      )}
      <p className={styles.note}>
        <Link to={paths.news}>Все новости</Link>
      </p>
    </Card>
  )
}
