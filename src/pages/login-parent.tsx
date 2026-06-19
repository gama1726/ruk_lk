/**
 * @file Вход для родителя (mock).
 */

import { checkEmail } from '@/mocks/login-roles'
import { LinkLoginForm } from './link-login-form'

/**
 * Родитель: почта и номер студенческого → ссылка на почту.
 */
export function ParentLogin() {
  return (
    <LinkLoginForm
      title="Вход для родителя"
      hint="Укажите личную почту и номер студенческого билета ребёнка. Ссылка для входа придёт на почту после подключения backend."
      fields={[
        { name: 'email', label: 'Ваш адрес электронной почты', placeholder: 'ivanov@mail.ru' },
        { name: 'studentId', label: 'Номер студенческого билета', placeholder: '0147823' },
      ]}
      validate={(values) => {
        const errors: Record<string, string> = {}
        const emailErr = checkEmail(values.email ?? '')
        if (emailErr) errors.email = emailErr
        if (!values.studentId?.trim()) errors.studentId = 'Укажите номер студенческого'
        return errors
      }}
      successText={(values) =>
        `Ссылка для входа отправлена на ${values.email.trim()} (mock). Проверьте почту через несколько минут.`
      }
    />
  )
}
