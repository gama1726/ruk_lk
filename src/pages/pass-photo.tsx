import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '@/apiClient'
import { paths } from '@/paths'
import {
  fetchPassPhotoSubmission,
  isPassPhotoApiEnabled,
  passPhotoImageUrl,
  passPhotoStatusLabel,
  setPassPhotoAsAvatar,
  uploadPassPhoto,
  validatePassPhoto,
  type PassPhotoSubmission,
} from '@/pass-photo'
import {
  validatePassPhotoClientBasic,
  type ClientValidationIssue,
} from '@/pass-photo-validation'
import { Button, Card, ScreenHeader } from '@/ui'
import styles from './pass-photo.module.css'

const tips = [
  'Снимите себя анфас у светлой стены (белой, серой или бежевой).',
  'В кадре — голова и плечи, хорошее освещение лица.',
  'Без других людей. Очки и борода допустимы.',
  'Формат JPG, JPEG, BMP или PNG, до 2 МБ.',
]

export function PassPhoto() {
  const [submission, setSubmission] = useState<PassPhotoSubmission | null>(null)
  const [loading, setLoading] = useState(true)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [issues, setIssues] = useState<ClientValidationIssue[]>([])
  const [clientOk, setClientOk] = useState(false)
  const [checking, setChecking] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [consent, setConsent] = useState(false)
  const [avatarSaving, setAvatarSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    if (!isPassPhotoApiEnabled()) {
      setLoading(false)
      return
    }
    try {
      const data = await fetchPassPhotoSubmission()
      setSubmission(data)
    } catch {
      setSubmission(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const onPickFile = async (picked: File | null) => {
    setError(null)
    setIssues([])
    setClientOk(false)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(null)
    setPreviewUrl(null)

    if (!picked) return

    const url = URL.createObjectURL(picked)
    setPreviewUrl(url)

    setChecking(true)
    try {
      const basic = validatePassPhotoClientBasic(picked)
      if (!basic.ok) {
        setIssues(basic.issues)
        return
      }

      const result = await validatePassPhoto(picked)
      const serverIssues: ClientValidationIssue[] = result.issues.map((i) => ({
        code: i.code ?? 'SERVER',
        severity: (i.severity ?? 'FAIL') as 'FAIL' | 'WARN',
        message: i.message,
      }))
      setIssues(serverIssues)
      setClientOk(result.ok)
      if (result.ok) {
        setFile(picked)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось проверить фото')
    } finally {
      setChecking(false)
    }
  }

  const onSubmit = async () => {
    if (!file || !clientOk || !consent) return
    setUploading(true)
    setError(null)
    try {
      const data = await uploadPassPhoto(file)
      setSubmission(data)
      setFile(null)
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
      setIssues([])
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message)
        const withIssues = e as ApiError & { issues?: ClientValidationIssue[] }
        if (withIssues.issues?.length) {
          setIssues(withIssues.issues.map((i) => ({
            code: i.code ?? 'SERVER',
            severity: (i.severity ?? 'FAIL') as 'FAIL' | 'WARN',
            message: i.message,
          })))
        }
      } else {
        setError('Не удалось отправить фото')
      }
    } finally {
      setUploading(false)
    }
  }

  const onToggleAvatar = async (checked: boolean) => {
    setAvatarSaving(true)
    setError(null)
    try {
      const data = await setPassPhotoAsAvatar(checked)
      setSubmission(data)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Не удалось сохранить настройку аватара')
    } finally {
      setAvatarSaving(false)
    }
  }

  const canUpload =
    !submission?.status ||
    submission.status === 'REJECTED' ||
    submission.status === 'PERCO_FAILED' ||
    (submission.status === 'PERCO_SYNCED' && submission.canResubmit === true)

  const showForm = canUpload
  const syncedCooldownHint =
    submission?.status === 'PERCO_SYNCED' &&
    submission.canResubmit === false &&
    submission.nextResubmitAt
      ? new Date(submission.nextResubmitAt).toLocaleString('ru-RU', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : null

  if (!isPassPhotoApiEnabled()) {
    return (
      <>
        <ScreenHeader title="Фото для пропуска" subtitle="Доступно при подключённом API" />
        <Card padding="lg">
          <p>Раздел работает с backend API. В демо-режиме загрузка недоступна.</p>
        </Card>
      </>
    )
  }

  if (loading) {
    return (
      <Card padding="lg">
        <p>Загрузка…</p>
      </Card>
    )
  }

  return (
    <>
      <ScreenHeader
        title="Фото для пропуска"
        subtitle="Загрузите фото для системы контроля доступа. После проверки сотрудником оно попадёт в Perco-Web."
      />

      {submission?.status && (
        <Card padding="md" className={styles.statusCard}>
          <p className={styles.statusLabel}>
            Статус: <strong>{passPhotoStatusLabel[submission.status]}</strong>
          </p>
          {submission.status === 'REJECTED' && submission.rejectReason && (
            <p className={styles.rejectReason}>{submission.rejectReason}</p>
          )}
          {submission.status === 'PERCO_FAILED' && submission.percoError && (
            <p className={styles.rejectReason}>{submission.percoError}</p>
          )}
          {submission.hasImage && submission.id && (
            <img
              className={styles.currentPhoto}
              src={passPhotoImageUrl(submission.id)}
              alt="Текущее загруженное фото"
            />
          )}
          {submission.status === 'PERCO_SYNCED' && submission.hasImage && (
            <label className={styles.consent}>
              <input
                type="checkbox"
                checked={submission.useAsAvatar === true}
                disabled={avatarSaving}
                onChange={(e) => void onToggleAvatar(e.target.checked)}
              />
              Использовать это фото как аватар в личном кабинете
            </label>
          )}
        </Card>
      )}

      {showForm && (
        <div className={styles.grid}>
          <Card padding="lg" className={styles.rules}>
            <h2 className={styles.h2}>Требования</h2>
            <ul className={styles.tips}>
              {tips.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </Card>

          <Card padding="lg" className={styles.upload}>
            <h2 className={styles.h2}>Загрузка</h2>

            <div className={styles.previewWrap}>
              {previewUrl ? (
                <img className={styles.preview} src={previewUrl} alt="Превью" />
              ) : (
                <div className={styles.previewPlaceholder}>
                  <span>Овал для лица</span>
                </div>
              )}
            </div>

            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/bmp,image/x-ms-bmp,.jpg,.jpeg,.bmp,.png"
              className={styles.fileInput}
              onChange={(e) => void onPickFile(e.target.files?.[0] ?? null)}
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => inputRef.current?.click()}
              disabled={checking || uploading}
            >
              {checking ? 'Проверка на сервере…' : 'Выбрать фото'}
            </Button>

            {issues.length > 0 && (
              <ul className={styles.issues}>
                {issues.map((issue, idx) => (
                  <li
                    key={`${issue.code}-${idx}`}
                    className={issue.severity === 'FAIL' ? styles.issueFail : styles.issueWarn}
                  >
                    {issue.message}
                  </li>
                ))}
              </ul>
            )}

            <label className={styles.consent}>
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
              />
              Согласен на обработку персональных данных и использование фото в системе пропуска
            </label>

            {error && <p className={styles.error}>{error}</p>}

            <Button
              type="button"
              onClick={() => void onSubmit()}
              disabled={!file || !clientOk || !consent || uploading}
            >
              {uploading ? 'Отправка…' : 'Отправить на проверку'}
            </Button>
          </Card>
        </div>
      )}

      {submission?.status === 'PENDING' && (
        <Card padding="lg">
          <p>Фото на проверке у сотрудника. Обычно это 1–2 рабочих дня.</p>
          <p className={styles.muted}>
            <Link to={paths.profile}>Вернуться в профиль</Link>
          </p>
        </Card>
      )}

      {submission?.status === 'PERCO_SYNCED' && (
        <Card padding="lg">
          <p>Фото принято и загружено в систему пропуска. Пропуск обновится в течение нескольких часов.</p>
          {syncedCooldownHint && (
            <p className={styles.muted}>
              Загрузить новое фото можно не чаще раза в 3 дня. Следующая попытка: {syncedCooldownHint}.
            </p>
          )}
          {submission.canResubmit === true && (
            <p className={styles.muted}>Можно отправить новое фото на проверку — форма ниже.</p>
          )}
        </Card>
      )}
    </>
  )
}
