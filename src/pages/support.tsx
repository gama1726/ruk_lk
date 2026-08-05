/**
 * @file Техподдержка личного кабинета (публичная).
 * @see {@link supportContacts}
 */

import { Link } from 'react-router-dom'
import { supportContacts } from '@/mocks/public'
import { paths } from '@/paths'
import { ScreenHeader, Card } from '@/ui'
import styles from './public.module.css'

/**
 * Контакты поддержки без авторизации.
 */
export function Support() {
  const c = supportContacts

  return (
    <>
      <ScreenHeader title="Техническая поддержка (dev)" subtitle="Помощь по работе личного кабинета" />

      <Card>
        <p className={styles.contacts}>
          <a href={`mailto:${c.email}`}>{c.email}</a>
          <br />
          {c.phone}
          <br />
          {c.hours}
        </p>
        <p className={styles.hint}>{c.note}</p>
      </Card>

      <p className={styles.back}>
        <Link to={paths.login}>К входу</Link>
      </p>
    </>
  )
}
