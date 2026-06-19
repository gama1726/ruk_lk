import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { paths } from '@/paths'
import { AuthCard } from '@/blocks/auth-card'
import card from '@/blocks/auth-card.module.css'
import { Input, Button } from '@/ui'
import form from './auth-form.module.css'
import pub from './public.module.css'

export type LinkLoginField = {
  name: string
  label: string
  placeholder?: string
}

type Props = {
  title: string
  hint: string
  fields: LinkLoginField[]
  /** @param values - значения полей формы */
  validate: (values: Record<string, string>) => Record<string, string>
  /** @param values - значения полей после успешной проверки */
  successText: (values: Record<string, string>) => string
}

/**
 * Форма «получить ссылку на почту» для родителя, договора и т.п.
 */
export function LinkLoginForm({ title, hint, fields, validate, successText }: Props) {
  const [values, setValues] = useState(() => Object.fromEntries(fields.map((f) => [f.name, ''])))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [done, setDone] = useState(false)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const nextErrors = validate(values)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    setDone(true)
  }

  return (
    <>
      <AuthCard>
        <p className={card.sectionLabel}>{title}</p>

        {done ? (
          <p className={pub.forgotOk}>{successText(values)}</p>
        ) : (
          <form className={form.form} onSubmit={handleSubmit}>
            <p className={form.hint}>{hint}</p>
            {fields.map((field) => (
              <Input
                key={field.name}
                label={field.label}
                name={field.name}
                placeholder={field.placeholder}
                value={values[field.name] ?? ''}
                error={errors[field.name]}
                onChange={(e) => setValues((v) => ({ ...v, [field.name]: e.target.value }))}
              />
            ))}
            <Button type="submit" fullWidth size="lg">
              Получить ссылку для входа
            </Button>
          </form>
        )}
      </AuthCard>

      <p className={pub.back}>
        <Link to={paths.login}>Вход для студента</Link>
      </p>
    </>
  )
}
