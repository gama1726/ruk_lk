/**
 * @file Полезные ссылки без входа в кабинет.
 * @see {@link resourceLinks}
 */

import { Link } from 'react-router-dom'
import { resourceLinks } from '@/mocks/public'
import { paths } from '@/paths'
import { ScreenHeader } from '@/ui'
import styles from './public.module.css'

/**
 * Публичный список внешних сервисов РУК.
 */
export function Resources() {
  return (
    <>
      <ScreenHeader title="Ресурсы" subtitle="Сервисы университета вне личного кабинета" />

      <ul className={styles.list}>
        {resourceLinks.map((r) => (
          <li key={r.id}>
            <a className={styles.link} href={r.url} target="_blank" rel="noopener noreferrer">
              <span className={styles.title}>{r.title}</span>
              <span className={styles.note}>{r.note}</span>
            </a>
          </li>
        ))}
      </ul>

      <div className={styles.back}>
        <Link to={paths.login}>К входу</Link>
      </div>
    </>
  )
}
