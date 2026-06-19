import { forwardRef, type SelectHTMLAttributes } from 'react'
import styles from './Select.module.css'

export interface SelectOption {
  value: string
  label: string
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: SelectOption[]
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, id, className, ...props }, ref) => {
    const selectId = id ?? (label ? `select-${label.replace(/\s/g, '-').toLowerCase()}` : undefined)

    return (
      <div className={styles.field}>
        {label ? (
          <label className={styles.label} htmlFor={selectId}>
            {label}
          </label>
        ) : null}
        <select
          ref={ref}
          id={selectId}
          className={[styles.select, className ?? ''].filter(Boolean).join(' ')}
          aria-invalid={error ? true : undefined}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error ? (
          <span className={styles.error} role="alert">
            {error}
          </span>
        ) : null}
      </div>
    )
  },
)

Select.displayName = 'Select'
