/**
 * @file Страница настроек аккаунта.
 * @see {@link useSettings}
 */

import { useEffect, useState, type FormEvent, type MouseEvent } from 'react'
import { useAuth } from '@/auth'
import { ApiError, isApiConfigured } from '@/apiClient'
import { maskPhone } from '@/mocks/format'
import { updateStudentEmail } from '@/profile'
import { useStudentProfile } from '@/student-profile-store'
import {
  notificationLabels,
  useSettings,
  type NotificationKey,
} from '@/settings'
import { ScreenHeader, Button, Input, Checkbox, Card } from '@/ui'
import styles from './settings.module.css'

/**
 * Настройки: контакты, уведомления, выход.
 */
export function Settings() {
  const signOut = useAuth((s) => s.signOut)
  const profile = useStudentProfile((s) => s.profile)
  const profileStatus = useStudentProfile((s) => s.status)
  const loadProfile = useStudentProfile((s) => s.load)
  const patchEmail = useStudentProfile((s) => s.patchEmail)
  const personalEmail = useSettings((s) => s.personalEmail)
  const phone = useSettings((s) => s.phone)
  const notifications = useSettings((s) => s.notifications)
  const setPersonalEmail = useSettings((s) => s.setPersonalEmail)
  const setPhone = useSettings((s) => s.setPhone)
  const setNotification = useSettings((s) => s.setNotification)

  const contactsFromApi = isApiConfigured()
  const currentEmail = contactsFromApi ? (profile?.email ?? '') : personalEmail
  const displayPhone = contactsFromApi ? (profile?.phone ?? '') : phone

  const [emailDraft, setEmailDraft] = useState(currentEmail)
  const [phoneDraft, setPhoneDraft] = useState(phone)
  const [emailError, setEmailError] = useState<string>()
  const [phoneError, setPhoneError] = useState<string>()
  const [emailSaved, setEmailSaved] = useState(false)
  const [emailBusy, setEmailBusy] = useState(false)
  const [emailMessage, setEmailMessage] = useState<string>()

  useEffect(() => {
    if (contactsFromApi && profileStatus === 'idle') {
      void loadProfile()
    }
  }, [contactsFromApi, profileStatus, loadProfile])

  useEffect(() => {
    setEmailDraft(currentEmail)
  }, [currentEmail])

  const handleSignOut = (_e: MouseEvent<HTMLButtonElement>) => {
    void signOut()
  }

  const handleEmail = async (e: FormEvent) => {
    e.preventDefault()
    setEmailSaved(false)
    setEmailMessage(undefined)
    setEmailError(undefined)

    if (contactsFromApi) {
      setEmailBusy(true)
      try {
        const result = await updateStudentEmail(emailDraft)
        patchEmail(result.email)
        setEmailDraft(result.email)
        setEmailSaved(true)
        setEmailMessage(result.message || 'Почта обновлена')
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : 'Не удалось изменить почту'
        setEmailError(message)
      } finally {
        setEmailBusy(false)
      }
      return
    }

    const err = setPersonalEmail(emailDraft)
    setEmailError(err ?? undefined)
    if (!err) {
      setEmailSaved(true)
      setEmailMessage('Почта обновлена')
    }
  }

  const handlePhone = (e: FormEvent) => {
    e.preventDefault()
    const err = setPhone(phoneDraft)
    setPhoneError(err ?? undefined)
  }

  return (
    <>
      <ScreenHeader
        title="Настройки (dev)"
        subtitle="Контакты и уведомления"
        actions={
          <Button variant="ghost" onClick={handleSignOut}>
            Выйти
          </Button>
        }
      />

      <section className={styles.section} id="email">
        <h2 className={styles.sectionTitle}>Контакты</h2>
        <Card>
          <form className={styles.form} onSubmit={(e) => void handleEmail(e)}>
            <Input
              label="Личная почта"
              type="email"
              value={emailDraft}
              error={emailError}
              disabled={emailBusy || (contactsFromApi && profileStatus === 'loading')}
              onChange={(e) => {
                setEmailDraft(e.target.value)
                setEmailSaved(false)
                setEmailMessage(undefined)
              }}
            />
            <Button type="submit" loading={emailBusy}>
              Сохранить почту
            </Button>
            {emailSaved && emailMessage ? <p className={styles.success}>{emailMessage}</p> : null}
          </form>

          {contactsFromApi ? (
            <div className={styles.form} id="phone" style={{ marginTop: '1.25rem' }}>
              <p className={styles.hint}>
                <strong>Телефон:</strong> {maskPhone(displayPhone)}
              </p>
            </div>
          ) : (
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
          )}
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
