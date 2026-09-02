import { useParentAuth } from '@/parent-auth'
import styles from './parent-survey.module.css'

export function ParentSurvey() {
  const session = useParentAuth((s) => s.session)
  if (!session) return null

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>Опрос университета</h1>
      <p className={styles.lead}>
        Уважаемый(ая) {session.parentFullName}, благодарим за готовность участвовать в опросе.
      </p>
      <p className={styles.text}>
        Этот раздел доступен независимо от согласия студента на передачу академических данных. Здесь
        появится форма опроса от университета.
      </p>
      <div className={styles.placeholder} aria-hidden="true">
        Форма опроса — в разработке
      </div>
    </div>
  )
}
