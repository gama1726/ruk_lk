/**
 * @file Страница настроек аккаунта.
 * @remarks Пароль не сохраняется — только mock-валидация до backend.
 * @see {@link useSettings}
 */

import { useState, type FormEvent, type MouseEvent } from 'react'
import { useAuth } from '@/auth'
import { isApiConfigured } from '@/apiClient'
import { maskPhone } from '@/mocks/format'
import { useStudentProfile } from '@/student-profile-store'
import {
  notificationLabels,
  useSettings,
  type NotificationKey,
} from '@/settings'
import { ScreenHeader, Button, Input, Checkbox, Card } from '@/ui'
import styles from './settings.module.css'

/**
 * Настройки: контакты, пароль, уведомления, выход.
 */
export function Settings() {
  const signOut = useAuth((s) => s.signOut)
  const profile = useStudentProfile((s) => s.profile)
  const personalEmail = useSettings((s) => s.personalEmail)
  const phone = useSettings((s) => s.phone)
  const notifications = useSettings((s) => s.notifications)
  const setPersonalEmail = useSettings((s) => s.setPersonalEmail)
  const setPhone = useSettings((s) => s.setPhone)
  const setNotification = useSettings((s) => s.setNotification)
  const changePassword = useSettings((s) => s.changePassword)

  const [emailDraft, setEmailDraft] = useState(personalEmail)
  const [phoneDraft, setPhoneDraft] = useState(phone)
  const [emailError, setEmailError] = useState<string>()
  const [phoneError, setPhoneError] = useState<string>()
  const [emailSaved, setEmailSaved] = useState(false)

  const [currentPwd, setCurrentPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')

  const handleSignOut = (_e: MouseEvent<HTMLButtonElement>) => {
    void signOut()
  }
  const [pwdError, setPwdError] = useState<string>()
  const [pwdSaved, setPwdSaved] = useState(false)

  const contactsFromApi = isApiConfigured()
  const displayEmail = contactsFromApi ? (profile?.email ?? '') : personalEmail
  const displayPhone = contactsFromApi ? (profile?.phone ?? '') : phone

  const handleEmail = (e: FormEvent) => {
    e.preventDefault()
    setEmailSaved(false)
    const err = setPersonalEmail(emailDraft)
    setEmailError(err ?? undefined)
    if (!err) setEmailSaved(true)
  }

  const handlePhone = (e: FormEvent) => {
    e.preventDefault()
    const err = setPhone(phoneDraft)
    setPhoneError(err ?? undefined)
  }

  const handlePassword = (e: FormEvent) => {
    e.preventDefault()
    setPwdSaved(false)
    const err = changePassword(currentPwd, newPwd, confirmPwd)
    setPwdError(err ?? undefined)
    if (!err) {
      setPwdSaved(true)
      setCurrentPwd('')
      setNewPwd('')
      setConfirmPwd('')
    }
  }

  return (
    <>
      <ScreenHeader
        title="Настройки (dev)"
        subtitle="Контакты, безопасность и уведомления"
        actions={
          <Button variant="ghost" onClick={handleSignOut}>
            Выйти
          </Button>
        }
      />

      <section className={styles.section} id="email">
        <h2 className={styles.sectionTitle}>Контакты</h2>
        <Card>
          {contactsFromApi ? (
            <div className={styles.form}>
              <p className={styles.hint}>
                <strong>Личная почта:</strong> {displayEmail || '—'}
              </p>
              <p className={styles.hint}>
                <strong>Телефон:</strong> {maskPhone(displayPhone)}
              </p>
              <p className={styles.securityNote}>
                Контакты синхронизируются из учётной системы университета. Изменить их можно в 1С.
              </p>
            </div>
          ) : (
            <>
              <form className={styles.form} onSubmit={handleEmail}>
                <Input
                  label="Личная почта"
                  type="email"
                  value={emailDraft}
                  error={emailError}
                  onChange={(e) => {
                    setEmailDraft(e.target.value)
                    setEmailSaved(false)
                  }}
                />
                <Button type="submit">Сохранить почту</Button>
                {emailSaved ? <p className={styles.success}>Почта обновлена в сессии</p> : null}
              </form>

              <form className={styles.form} onSubmit={handlePhone} id="phone" style={{ marginTop: '1.25rem' }}>
                <Input
                  label="Телефон"
                  type="tel"
                  value={phoneDraft}
                  error={phoneError}
                  onChange={(e) => setPhoneDraft(e.target.value)}
                />
                <p className={styles.hint}>Сейчас в профиле: {maskPhone(phone)}</p>
                <Button type="submit">Сохранить телефон</Button>
              </form>
            </>
          )}
        </Card>
      </section>

      <section className={styles.section} id="password">
        <h2 className={styles.sectionTitle}>Безопасность</h2>
        <Card>
          <form className={styles.form} onSubmit={handlePassword}>
            <Input
              label="Текущий пароль"
              type="password"
              autoComplete="current-password"
              value={currentPwd}
              error={pwdError}
              onChange={(e) => {
                setCurrentPwd(e.target.value)
                setPwdSaved(false)
              }}
            />
            <Input
              label="Новый пароль"
              type="password"
              autoComplete="new-password"
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
            />
            <Input
              label="Повторите новый пароль"
              type="password"
              autoComplete="new-password"
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
            />
            <Button type="submit">Изменить пароль</Button>
            {pwdSaved ? <p className={styles.success}>Пароль принят (mock, не сохранён)</p> : null}
          </form>
          <p className={styles.securityNote}>
            {isApiConfigured()
              ? 'После подключения API смена пароля уйдёт на сервер авторизации.'
              : 'Смена пароля заработает после подключения backend и SSO.'}
          </p>
        </Card>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Уведомления</h2>
        <Card>
          <div className={styles.checks}>
            {(Object.keys(notificationLabels) as NotificationKey[]).map((key) => (
              <Checkbox
                key={key}
                label={notificationLabels[key]}
                checked={notifications[key]}
                onChange={(e) => setNotification(key, e.target.checked)}
              />
            ))}
          </div>
        </Card>
      </section>
    </>
  )
}
