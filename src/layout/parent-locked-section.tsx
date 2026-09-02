import { Link, Navigate } from 'react-router-dom'
import { useParentAuth } from '@/parent-auth'
import { paths } from '@/paths'
import { PARENT_CONSENT_MESSAGE } from '@/parent-consent'
import styles from './parent-locked-section.module.css'

type Props = {
  title: string
  children?: React.ReactNode
}

/** Раздел с данными ребёнка — только при dataAccessAllowed. */
export function ParentDataSection({ title, children }: Props) {
  const session = useParentAuth((s) => s.session)

  if (!session) {
    return <Navigate to={paths.loginParent} replace />
  }

  if (!session.dataAccessAllowed) {
    return (
      <div className={styles.wrap}>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.alert}>{session.consentRequiredMessage ?? PARENT_CONSENT_MESSAGE}</p>
        <p className={styles.hint}>
          Раздел «{title}» недоступен, пока студент не подпишет согласие. Вы можете пройти{' '}
          <Link to={paths.parentSurvey}>опрос университета</Link>.
        </p>
      </div>
    )
  }

  return children ?? null
}
