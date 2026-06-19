import { programWarnings } from '@/mocks/warnings'
import { useCurrentProgram } from '@/study'
import { Card } from '@/ui'
import styles from './home.module.css'

/**
 * Академические предупреждения. Скрывается, если список пуст.
 */
export function WarningsList() {
  const program = useCurrentProgram()
  const items = programWarnings(program.id)

  if (items.length === 0) return null

  return (
    <Card title="Обратите внимание" className={styles.wide}>
      <ul className={styles.warnList}>
        {items.map((w) => (
          <li key={w.id} className={styles.warnItem}>
            {w.text}
          </li>
        ))}
      </ul>
    </Card>
  )
}
