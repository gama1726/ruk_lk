import { Link } from 'react-router-dom'
import { homeNotices, noticeCategoryLabel, unreadCount } from '@/mocks/notices'
import { paths } from '@/paths'
import { Card, Badge } from '@/ui'
import styles from './home.module.css'

/**
 * Важные уведомления на главной.
 */
export function NoticesFeed() {
  const items = homeNotices()
  const unread = unreadCount()

  return (
    <Card title="Уведомления">
      {unread > 0 ? (
        <p className={styles.note}>
          <Badge variant="primary">{unread} непрочитанное</Badge>
        </p>
      ) : null}
      <ul className={styles.noticeList}>
        {items.map((n) => (
          <li key={n.id} className={[styles.noticeItem, !n.read ? styles.noticeItemUnread : ''].filter(Boolean).join(' ')}>
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
