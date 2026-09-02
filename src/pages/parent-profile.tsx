import { useParentAuth } from '@/parent-auth'
import styles from './parent-profile.module.css'

export function ParentProfile() {
  const session = useParentAuth((s) => s.session)
  if (!session) return null

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>Профиль</h1>
      <dl className={styles.list}>
        <div className={styles.row}>
          <dt>Вы</dt>
          <dd>
            {session.parentFullName} ({session.relation})
          </dd>
        </div>
        <div className={styles.row}>
          <dt>Студент</dt>
          <dd>{session.studentFullName}</dd>
        </div>
        <div className={styles.row}>
          <dt>Номер зачётки</dt>
          <dd>{session.studentId}</dd>
        </div>
        {session.isCustomer ? (
          <div className={styles.row}>
            <dt>Договор</dt>
            <dd>Заказчик / плательщик</dd>
          </div>
        ) : null}
      </dl>
    </div>
  )
}
