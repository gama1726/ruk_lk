import styles from './Loader.module.css'

type Props = {
  text?: string
}

export function Loader({ text = 'Загрузка…' }: Props) {
  return (
    <div className={styles.loading} role="status" aria-live="polite">
      <div className={styles.spinner} aria-hidden="true" />
      <p className={styles.text}>{text}</p>
    </div>
  )
}
