/**
 * @file Вход для целевого обучения (mock).
 */

import { checkEmail, checkInn } from '@/mocks/login-roles'
import { LinkLoginForm } from './link-login-form'

/**
 * Заказчик целевого обучения: почта и ИНН организации.
 */
export function TargetLogin() {
  return (
    <LinkLoginForm
      title="Вход для заказчиков целевого обучения"
      hint="Для организаций-партнёров, направляющих сотрудников на обучение в РУК."
      fields={[
        { name: 'email', label: 'Корпоративная почта', placeholder: 'hr@company.ru' },
        { name: 'inn', label: 'ИНН организации', placeholder: '7701234567' },
      ]}
      validate={(values) => {
        const errors: Record<string, string> = {}
        const emailErr = checkEmail(values.email ?? '')
        if (emailErr) errors.email = emailErr
        const innErr = checkInn(values.inn ?? '')
        if (innErr) errors.inn = innErr
        return errors
      }}
      successText={(values) =>
        `Запрос принят. Ссылка для входа придёт на ${values.email.trim()} (mock).`
      }
    />
  )
}
