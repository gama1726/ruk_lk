import { forwardRef, type TextareaHTMLAttributes } from 'react'
import styles from './Textarea.module.css'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, id, className, ...props }, ref) => {
    const textareaId = id ?? (label ? `textarea-${label.replace(/\s/g, '-').toLowerCase()}` : undefined)

    return (
      <div className={styles.field}>
        {label ? (
          <label className={styles.label} htmlFor={textareaId}>
            {label}
          </label>
        ) : null}
        <textarea
          ref={ref}
          id={textareaId}
          className={[styles.textarea, className ?? ''].filter(Boolean).join(' ')}
          aria-invalid={error ? true : undefined}
          {...props}
        />
        {error ? (
          <span className={styles.error} role="alert">
            {error}
          </span>
        ) : null}
      </div>
    )
  },
)

Textarea.displayName = 'Textarea'
