import { forwardRef, type InputHTMLAttributes } from 'react'
import styles from './Checkbox.module.css'

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
  error?: string
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, id, className, ...props }, ref) => {
    const checkboxId = id ?? `checkbox-${label.replace(/\s/g, '-').toLowerCase()}`

    return (
      <div>
        <label className={[styles.checkbox, className ?? ''].filter(Boolean).join(' ')} htmlFor={checkboxId}>
          <input ref={ref} type="checkbox" id={checkboxId} className={styles.input} {...props} />
          <span className={styles.label}>{label}</span>
        </label>
        {error ? (
          <span className={styles.error} role="alert">
            {error}
          </span>
        ) : null}
      </div>
    )
  },
)

Checkbox.displayName = 'Checkbox'
