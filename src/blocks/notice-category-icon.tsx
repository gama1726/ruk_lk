import type { NoticeCategory } from '@/mocks/notices'
import styles from './notice-category-icon.module.css'

const paths: Record<NoticeCategory, string> = {
  dekanat:
    'M10.394 2.08a1 1 0 0 0-.788 0l-7 3a1 1 0 0 0-.606.92V16a1 1 0 0 0 1 1h2v-5h10v5h2a1 1 0 0 0 1-1V6a1 1 0 0 0-.606-.92l-7-3zM8 16.5V9h8v7.5H8z',
  finance:
    'M10 2a6 6 0 0 0-6 6c0 2.97 2.16 5.43 5 5.91V18H5a1 1 0 1 0 0 2h10a1 1 0 1 0 0-2h-4v-4.09c2.84-.48 5-2.94 5-5.91a6 6 0 0 0-6-6zm0 2a4 4 0 0 1 4 4c0 1.85-1.26 3.4-2.97 3.85a1 1 0 0 0-.7.95V14h-1.66v-1.2a1 1 0 0 0-.7-.95A4.01 4.01 0 0 1 6 8a4 4 0 0 1 4-4z',
  requests:
    'M6 2a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7.414A2 2 0 0 0 15.414 6L12 2.586A2 2 0 0 0 10.586 2H6zm4 1.414L14.586 8H12a2 2 0 0 1-2-2V3.414zM8 11a1 1 0 0 1 1-1h2a1 1 0 1 1 0 2H9a1 1 0 0 1-1-1zm0 4a1 1 0 0 1 1-1h4a1 1 0 1 1 0 2H9a1 1 0 0 1-1-1z',
  teachers:
    'M10 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM4 15.5a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4V17a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-1.5z',
  system:
    'M10 2.75a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5zM5.5 6.25a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5zM14.5 6.25a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5zM10 9.75a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5zM5.5 13.25a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5zM14.5 13.25a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5z',
}

type Props = {
  category: NoticeCategory
}

/** Иконка категории уведомления для ленты на профиле. */
export function NoticeCategoryIcon({ category }: Props) {
  return (
    <span className={[styles.icon, styles[category]].join(' ')} aria-hidden="true">
      <svg viewBox="0 0 20 20" width="18" height="18">
        <path fill="currentColor" d={paths[category]} />
      </svg>
    </span>
  )
}
