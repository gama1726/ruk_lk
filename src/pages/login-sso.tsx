/**
 * @file Вход преподавателя — раздел пока недоступен.
 */

import { Link } from 'react-router-dom'
import { paths } from '@/paths'
import { AuthBrand } from '@/blocks/auth-card'
import styles from './login-sso.module.css'

/** Заглушка вместо mock-SSO для преподавателя. */
export function SsoLogin() {
  return (
    <>
      <AuthBrand audience="teacher" />
      <h1 className={styles.title}>Скоро</h1>
      <p className={styles.realm}>Кабинет преподавателя в разработке</p>
      <p className={styles.hint}>
        <Link to={paths.login}>Вернуться ко входу</Link>
      </p>
    </>
  )
}
