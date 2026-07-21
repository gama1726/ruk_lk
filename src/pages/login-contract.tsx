/**
 * @file Вход для владельца договора (mock).
 */

import { checkEmail } from '@/mocks/login-roles'
import { LinkLoginForm } from './link-login-form'

/**
 * Заказчик по договору ВО: почта и номер договора.
 */
export function ContractLogin() {
  return (
    <LinkLoginForm
      title="Вход для владельца договора (dev)"
      hint="Для оплаты обучения и просмотра договора. Данные сверяются с учётной системой университета."
      fields={[
        { name: 'email', label: 'Ваш адрес электронной почты', placeholder: 'payer@mail.ru' },
        { name: 'contract', label: 'Номер договора', placeholder: 'ДГ-2023/0142-ИБ' },
      ]}
      validate={(values) => {
        const errors: Record<string, string> = {}
        const emailErr = checkEmail(values.email ?? '')
        if (emailErr) errors.email = emailErr
        if (!values.contract?.trim()) errors.contract = 'Укажите номер договора'
        return errors
      }}
      successText={(values) =>
        `Ссылка отправлена на ${values.email.trim()} (mock). По договору ${values.contract.trim()}.`
      }
    />
  )
}
