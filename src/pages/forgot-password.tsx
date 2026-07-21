/**
 * @file Восстановление пароля (mock).
 * @remarks Пароль не сохраняется — только проверка полей.
 */

import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { paths } from '@/paths'
import { AuthCard } from '@/blocks/auth-card'
import card from '@/blocks/auth-card.module.css'
import { Input, Button } from '@/ui'
import styles from './public.module.css'
import form from './auth-form.module.css'

/**
 * Mock-форма сброса пароля до подключения SSO.
 */
export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [emailError, setEmailError] = useState<string>()
  const [pwdError, setPwdError] = useState<string>()
  const [done, setDone] = useState(false)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setEmailError(undefined)
    setPwdError(undefined)

    const trimmed = email.trim()
    if (!trimmed || !trimmed.includes('@')) {
      setEmailError('Укажите корпоративную почту')
      return
    }
    if (!next || next.length < 6) {
      setPwdError('Новый пароль — не короче 6 символов')
      return
    }
    if (next !== confirm) {
      setPwdError('Пароли не совпадают')
      return
    }

    setDone(true)
  }

  return (
    <>
      <AuthCard>
        <p className={card.sectionLabel}>Восстановление пароля (dev)</p>

        {done ? (
          <p className={styles.forgotOk}>
            Запрос принят. После подключения SSO письмо с инструкцией придёт на {email.trim()}.
          </p>
        ) : (
          <form className={form.form} onSubmit={handleSubmit}>
            <p className={form.hint}>
              Укажите почту студента РУК и новый пароль. Сейчас это заглушка — пароль никуда не уходит.
            </p>
            <Input
              label="Корпоративная почта"
              type="email"
              value={email}
              error={emailError}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              label="Новый пароль"
              type="password"
              autoComplete="new-password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
            />
            <Input
              label="Повторите пароль"
              type="password"
              autoComplete="new-password"
              value={confirm}
              error={pwdError}
              onChange={(e) => setConfirm(e.target.value)}
            />
            <Button type="submit" fullWidth size="lg">
              Восстановить пароль
            </Button>
          </form>
        )}
      </AuthCard>

      <p className={styles.back}>
        <Link to={paths.login}>Вход для студента</Link>
      </p>
    </>
  )
}
