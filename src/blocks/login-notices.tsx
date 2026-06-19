/**
 * @file Объявления на экране входа.
 * @see {@link loginNotices}
 */

import { loginNotices } from '@/mocks/public'
import styles from './login-notices.module.css'

/**
 * Блок коротких объявлений под формой входа.
 */
export function LoginNotices() {
  return (
    <ul className={styles.notices}>
      {loginNotices.map((n) => (
        <li key={n.id} className={styles.item}>
          <p className={styles.title}>{n.title}</p>
          <p className={styles.text}>{n.text}</p>
        </li>
      ))}
    </ul>
  )
}
