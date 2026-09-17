/**
 * @file Вход для родителя — шаг 1: номер зачетной книжки.
 */

import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { paths } from '@/paths'
import { useParentAuth } from '@/parent-auth'
import { AuthCard } from '@/blocks/auth-card'
import card from '@/blocks/auth-card.module.css'
import { Input, Button } from '@/ui'
import form from './auth-form.module.css'

export function ParentLogin() {
  const navigate = useNavigate()
  const identify = useParentAuth((s) => s.identify)
  const [fieldErrors, setFieldErrors] = useState<{ studentId?: string; form?: string }>({})
  const [busy, setBusy] = useState(false)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const studentId = String(data.get('studentId') ?? '')

    if (!studentId.trim()) {
      setFieldErrors({ studentId: 'Укажите номер зачетной книжки' })
      return
    }

    setFieldErrors({})
    setBusy(true)
    const err = await identify(studentId)
    setBusy(false)
    if (err) {
      setFieldErrors({ form: err })
      return
    }
    navigate(paths.loginParentSelect)
  }

  return (
    <AuthCard brand="parent">
      <p className={card.sectionLabel}>Вход для родителя</p>
      <p className={form.hint}>
        Укажите номер зачетной книжки ребёнка. На следующем шаге выберите, как вы связаны с обучающимся.
      </p>
      <form className={form.form} onSubmit={(e) => void handleSubmit(e)}>
        <Input
          label="Номер зачетной книжки ребёнка"
          name="studentId"
          placeholder="831857"
          inputMode="numeric"
          error={fieldErrors.studentId ?? fieldErrors.form}
          disabled={busy}
        />
        <Button type="submit" fullWidth size="lg" loading={busy}>
          Продолжить
        </Button>
      </form>
      <p className={card.forgotRow}>
        <Link to={paths.login}>К способам входа</Link>
      </p>
    </AuthCard>
  )
}
