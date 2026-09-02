import { Link } from 'react-router-dom'
import { useParentAuth } from '@/parent-auth'
import { paths } from '@/paths'
import { PARENT_CONSENT_MESSAGE } from '@/parent-consent'
import styles from './parent-home.module.css'

export function ParentHome() {
  const session = useParentAuth((s) => s.session)
  if (!session) return null

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>Здравствуйте, {session.parentFullName}</h1>
      <p className={styles.sub}>
        {session.relation}, студент: <strong>{session.studentFullName}</strong>
      </p>

      {!session.dataAccessAllowed ? (
        <div className={styles.alert} role="alert">
          {session.consentRequiredMessage ?? PARENT_CONSENT_MESSAGE}
        </div>
      ) : null}

      <div className={styles.cards}>
        <Link to={paths.parentSurvey} className={styles.card}>
          <span className={styles.cardTitle}>Опрос университета</span>
          <span className={styles.cardHint}>Доступен всегда — ваше мнение важно для нас</span>
        </Link>
        {!session.dataAccessAllowed ? (
          <div className={styles.cardMuted}>
            <span className={styles.cardTitle}>Данные об обучении</span>
            <span className={styles.cardHint}>
              Разделы меню отмечены красным и станут доступны после подписания согласия студентом
            </span>
          </div>
        ) : (
          <Link to={paths.parentSchedule} className={styles.card}>
            <span className={styles.cardTitle}>Расписание и успеваемость</span>
            <span className={styles.cardHint}>Перейти к разделам обучения</span>
          </Link>
        )}
      </div>
    </div>
  )
}
