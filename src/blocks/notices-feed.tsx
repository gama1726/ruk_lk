import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { notices, noticeCategoryLabel } from '@/mocks/notices'
import { useUnreadCount, useReadState } from '@/notice-read'
import { paths } from '@/paths'
import { Card, Badge } from '@/ui'
import styles from './home.module.css'

/**
 * Важные уведомления на главной.
 */
export function NoticesFeed() {
  const overrides = useReadState((s) => s.overrides)
  const items = useMemo(
    () => [...notices].sort((a, b) => Number(overrides[a.id]) - Number(overrides[b.id])).slice(0, 3),
    [overrides],
  )
  const unread = useUnreadCount()

  return (
    <Card title="Уведомления">
      {unread > 0 ? (
        <p className={styles.note}>
          <Badge variant="primary">{unread} непрочитанное</Badge>
        </p>
      ) : null}
      <ul className={styles.noticeList}>
        {items.map((n) => (
          <li key={n.id} className={[styles.noticeItem, !overrides[n.id] ? styles.noticeItemUnread : ''].filter(Boolean).join(' ')}>
            <div className={styles.noticeTitle}>{n.title}</div>
            <div className={styles.noticePreview}>
              {noticeCategoryLabel(n.category)} · {n.preview}
            </div>
          </li>
        ))}
      </ul>
      <p className={styles.note}>
        <Link to={paths.news}>Все уведомления</Link>
      </p>
    </Card>
  )
}
