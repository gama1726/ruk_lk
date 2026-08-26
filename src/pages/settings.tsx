/**
 * @file Страница настроек аккаунта.
 * @see {@link useSettings}
 */

import { useEffect, useState, type FormEvent, type MouseEvent } from 'react'
import { useAuth } from '@/auth'
import { ApiError, isApiConfigured } from '@/apiClient'
import { maskPhone } from '@/mocks/format'
import { confirmEmailChange, requestEmailChange } from '@/profile'
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
  const [codeSentTo, setCodeSentTo] = useState<string>()
  const [codeDraft, setCodeDraft] = useState('')
  const [emailEditing, setEmailEditing] = useState(false)

  useEffect(() => {
    if (contactsFromApi && profileStatus === 'idle') {
      void loadProfile()
    }
  }, [contactsFromApi, profileStatus, loadProfile])

  useEffect(() => {
    setEmailDraft(currentEmail)
    setCodeSentTo(undefined)
    setCodeDraft('')
    setEmailEditing(false)
  }, [currentEmail])

  const handleSignOut = (_e: MouseEvent<HTMLButtonElement>) => {
    void signOut()
  }

  const resetEmailFeedback = () => {
    setEmailSaved(false)
    setEmailMessage(undefined)
    setEmailError(undefined)
  }

  const startEmailEdit = () => {
    resetEmailFeedback()
    setEmailDraft(currentEmail)
    setCodeSentTo(undefined)
    setCodeDraft('')
    setEmailEditing(true)
  }

  const cancelEmailEdit = () => {
    setEmailEditing(false)
    setEmailDraft(currentEmail)
    setCodeSentTo(undefined)
    setCodeDraft('')
    resetEmailFeedback()
  }

  const handleRequestCode = async (e: FormEvent) => {
    e.preventDefault()
    resetEmailFeedback()

    if (contactsFromApi) {
      setEmailBusy(true)
      try {
        const result = await requestEmailChange(emailDraft)
        setCodeSentTo(result.maskedEmail)
        setCodeDraft('')
        setEmailMessage(result.message)
      } catch (err) {
        const message =
          err instanceof ApiError ? err.message : 'Не удалось отправить код'
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

  const handleConfirmCode = async (e: FormEvent) => {
    e.preventDefault()
    resetEmailFeedback()
    setEmailBusy(true)
    try {
      const result = await confirmEmailChange(codeDraft)
      patchEmail(result.email)
      setEmailDraft(result.email)
      setCodeSentTo(undefined)
      setCodeDraft('')
      setEmailEditing(false)
      setEmailSaved(true)
      setEmailMessage(result.message || 'Почта обновлена')
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Не удалось подтвердить смену почты'
      setEmailError(message)
    } finally {
      setEmailBusy(false)
    }
  }

  const handleCancelCode = () => {
    setCodeSentTo(undefined)
    setCodeDraft('')
    resetEmailFeedback()
  }

  const handlePhone = (e: FormEvent) => {
    e.preventDefault()
    const err = setPhone(phoneDraft)
    setPhoneError(err ?? undefined)
  }

  const awaitingCode = contactsFromApi && Boolean(codeSentTo)
  const showEmailEditor = !contactsFromApi || emailEditing

  return (
    <>
      <ScreenHeader
        title="Настройки"
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
          {awaitingCode ? (
            <form className={styles.form} onSubmit={(e) => void handleConfirmCode(e)}>
              <p className={styles.hint}>
                Код отправлен на <strong>{codeSentTo}</strong>. Проверьте входящие и папку «Спам».
              </p>
              <Input
                label="Код из письма"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={codeDraft}
                error={emailError}
                disabled={emailBusy}
                onChange={(e) => {
                  setCodeDraft(e.target.value.replace(/\D/g, '').slice(0, 6))
                  resetEmailFeedback()
                }}
              />
              <div className={styles.emailActions}>
                <Button type="submit" loading={emailBusy} disabled={codeDraft.length < 6}>
                  Подтвердить смену почты
                </Button>
                <Button type="button" variant="ghost" disabled={emailBusy} onClick={handleCancelCode}>
                  Изменить адрес
                </Button>
              </div>
              {emailMessage && !emailError ? <p className={styles.hint}>{emailMessage}</p> : null}
            </form>
          ) : showEmailEditor ? (
            <form className={styles.form} onSubmit={(e) => void handleRequestCode(e)}>
              <Input
                label="Личная почта"
                type="email"
                value={emailDraft}
                error={emailError}
                disabled={emailBusy || (contactsFromApi && profileStatus === 'loading')}
                onChange={(e) => {
                  setEmailDraft(e.target.value)
                  resetEmailFeedback()
                }}
              />
              {contactsFromApi ? (
                <>
                  <p className={styles.hint}>
                    На новый адрес придёт код подтверждения. Почта в базе изменится только после ввода кода.
                  </p>
                  <div className={styles.emailActions}>
                    <Button type="submit" loading={emailBusy}>
                      Отправить код
                    </Button>
                    <Button type="button" variant="ghost" disabled={emailBusy} onClick={cancelEmailEdit}>
                      Отмена
                    </Button>
                  </div>
                </>
              ) : (
                <Button type="submit" loading={emailBusy}>
                  Сохранить почту
                </Button>
              )}
              {emailSaved && emailMessage ? <p className={styles.success}>{emailMessage}</p> : null}
            </form>
          ) : (
            <div className={styles.form}>
              <Input
                label="Личная почта"
                type="email"
                value={currentEmail}
                disabled
              />
              <Button
                type="button"
                onClick={startEmailEdit}
                disabled={profileStatus === 'loading'}
              >
                Изменить почту
              </Button>
              {emailSaved && emailMessage ? <p className={styles.success}>{emailMessage}</p> : null}
            </div>
          )}

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
