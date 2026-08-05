import { useState } from 'react'
import {
  filterNotices,
  noticeCategoryLabel,
  noticeFilters,
  type NoticeFilter,
} from '@/mocks/notices'
import { useReadState } from '@/notice-read'
import { ScreenHeader, Badge, NoData } from '@/ui'
import styles from './news.module.css'

/**
 * Форматирует дату уведомления.
 * @param iso - `YYYY-MM-DD`
 */
function formatNoticeDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' }).format(new Date(y, m - 1, d))
}

/**
 * Новости и уведомления: фильтры и статус прочитано/непрочитано.
 */
export function News() {
  const [filter, setFilter] = useState<NoticeFilter>('all')
  const isRead = useReadState((s) => s.isRead)
  const setRead = useReadState((s) => s.setRead)

  const items = filterNotices(filter).sort((a, b) => b.date.localeCompare(a.date))

  return (
    <>
      <ScreenHeader title="Новости и уведомления" subtitle="Объявления университета и личные сообщения" />

      <div className={styles.filters} role="tablist" aria-label="Фильтр уведомлений">
        {noticeFilters.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={filter === f.id}
            className={[styles.filterBtn, filter === f.id ? styles.filterBtnActive : ''].filter(Boolean).join(' ')}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <NoData title="Нет уведомлений" description="В этой категории пока пусто." />
      ) : (
        <ul className={styles.list}>
          {items.map((n) => {
            const read = isRead(n.id)
            return (
              <li
                key={n.id}
                className={[styles.item, !read ? styles.itemUnread : ''].filter(Boolean).join(' ')}
              >
                <div className={styles.itemHead}>
                  <h2 className={styles.title}>{n.title}</h2>
                  {!read ? <Badge variant="primary">новое</Badge> : null}
                </div>
                <p className={styles.meta}>
                  {noticeCategoryLabel(n.category)} · {formatNoticeDate(n.date)}
                </p>
                <p className={styles.preview}>{n.preview}</p>
                <div className={styles.actions}>
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
      )}
    </>
  )
}
