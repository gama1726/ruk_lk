/**
 * @file Панель «Расписания» под календарём.
 */

import styles from './schedule-sources.module.css'

type Props = {
  group: string
}

/**
 * @param props.group - учебная группа активной программы
 */
export function ScheduleSources({ group }: Props) {
  return (
    <div className={styles.wrap}>
      <h2 className={styles.title}>Расписания</h2>

      <div className={styles.row}>
        <span className={styles.badge}>
          <svg className={styles.lock} viewBox="0 0 20 20" width="14" height="14" aria-hidden="true">
            <path
              fill="currentColor"
              d="M5 9V7a5 5 0 0 1 10 0v2h1a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1h1zm2 0h6V7a3 3 0 0 0-6 0v2z"
            />
          </svg>
          {group}
        </span>

        <div className={styles.views} aria-hidden="true">
          <span className={styles.viewActive} title="Сетка дня">
            <svg viewBox="0 0 20 20" width="16" height="16">
              <path fill="currentColor" d="M6 2a1 1 0 0 0-1 1v2H3a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-2V3a1 1 0 0 0-1-1H6zm8 3H6v1h8V5z" />
            </svg>
          </span>
          <span className={styles.view} title="Список">
            <svg viewBox="0 0 20 20" width="16" height="16">
              <path fill="currentColor" d="M3 4.75A.75.75 0 0 1 3.75 4h12.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 4.75zm0 5A.75.75 0 0 1 3.75 9h12.5a.75.75 0 0 1 0 1.5H3.75A.75.75 0 0 1 3 9.75zm0 5a.75.75 0 0 1 .75-.75h12.5a.75.75 0 0 1 0 1.5H3.75a.75.75 0 0 1-.75-.75z" />
            </svg>
          </span>
        </div>
      </div>

      <input className={styles.add} type="text" placeholder="Добавить" disabled aria-label="Добавить расписание" />
    </div>
  )
}
