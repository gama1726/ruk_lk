/**
 * @file Вход по зачётке — шаг 1: только номер зачётки.
 */

import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth'
import { paths } from '@/paths'
import { AuthCard } from '@/blocks/auth-card'
import card from '@/blocks/auth-card.module.css'
import { Input, Button } from '@/ui'
import form from './auth-form.module.css'

/**
 * Зачётка → {@link paths.loginDelivery}.
 */
export function StudentLogin() {
  const navigate = useNavigate()
  const identifyStudent = useAuth((s) => s.identifyStudent)
  const [studentIdError, setStudentIdError] = useState<string>()
  const [busy, setBusy] = useState(false)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setStudentIdError(undefined)

    const data = new FormData(e.currentTarget)
    const studentId = String(data.get('studentId') ?? '')

    setBusy(true)
    const result = await identifyStudent(studentId)
    setBusy(false)

    if (result) {
      setStudentIdError(result.message)
      return
    }

    navigate(paths.loginDelivery)
  }

  return (
    <AuthCard>
      <p className={card.sectionLabel}>Вход по номеру зачётки</p>
      <p className={form.hint}>Укажите номер зачётки — проверим, что вы есть в базе студентов.</p>

      <form className={form.form} onSubmit={(e) => void handleSubmit(e)}>
        <Input
          label="Номер зачётки"
          name="studentId"
          autoComplete="username"
          placeholder="172194"
          inputMode="numeric"
          error={studentIdError}
          disabled={busy}
        />

        <Button type="submit" fullWidth size="lg" loading={busy}>
          Продолжить
        </Button>
      </form>

      <p className={card.forgotRow}>
        <Link to={paths.login}>Войти через SSO</Link>
      </p>
    </AuthCard>
  )
}
