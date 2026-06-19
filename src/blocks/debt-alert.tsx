import { Link } from 'react-router-dom'
import { activeDebts } from '@/mocks/debts'
import { formatShortDate } from '@/mocks/payment'
import { useCurrentProgram } from '@/study'
import { paths } from '@/paths'
import { Card } from '@/ui'
import styles from './home.module.css'

/**
 * Блок задолженностей на главной. Не рендерится, если их нет.
 */
export function DebtAlert() {
  const program = useCurrentProgram()
  const debts = activeDebts(program.id)

  if (debts.length === 0) return null

  const debt = debts[0]

  return (
    <Card title="Задолженность">
      <p className={styles.muted}>
        <strong>{debt.subject}</strong> · {debt.controlForm}
      </p>
      <p className={styles.muted}>{debt.teacher}</p>
      <p className={styles.note}>Пересдача до {formatShortDate(debt.retakeUntil)}</p>
      <p className={styles.note}>
        <Link to={paths.debts}>Все задолженности</Link>
      </p>
    </Card>
  )
}
