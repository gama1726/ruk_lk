/**
 * @file Ссылки на вход для других ролей.
 * @see {@link loginRoleLinks}
 */

import { Link } from 'react-router-dom'
import { loginRoleLinks } from '@/mocks/login-roles'
import styles from './login-role-links.module.css'

/**
 * Список альтернативных входов под формой студента.
 */
export function LoginRoleLinks() {
  return (
    <ul className={styles.roleLinks}>
      {loginRoleLinks.map((item) => (
        <li key={item.to}>
          <Link to={item.to} className={styles.roleLink}>
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  )
}
