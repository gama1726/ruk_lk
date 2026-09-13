import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { ApiError } from '@/apiClient'
import { isPassPhotoNavVisible } from '@/campus'
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
  PASS_PHOTO_FORMAT_HINT,
  PASS_PHOTO_MAX_BYTES,
  PASS_PHOTO_MIN_HEIGHT,
  PASS_PHOTO_MIN_WIDTH,
  validateIdCardClient,
  validatePassPhotoClient,
  type ClientValidationIssue,
} from '@/pass-photo-validation'
import { Button, Card, ScreenHeader } from '@/ui'
import { useStudentProfile } from '@/student-profile-store'
import styles from './pass-photo.module.css'

const tips = [
  'Снимите себя анфас у светлой однотонной стены.',
  'В кадре — голова и плечи, лицо хорошо видно.',
  'Отдельно приложите фото студенческого билета (разворот с фото, номером и ФИО) — для проверки сотрудником.',
  `Формат ${PASS_PHOTO_FORMAT_HINT}, до ${Math.round(PASS_PHOTO_MAX_BYTES / (1024 * 1024))} МБ.`,
  `Минимальный размер фото лица — ${PASS_PHOTO_MIN_WIDTH}×${PASS_PHOTO_MIN_HEIGHT} пикселей.`,
]

export function PassPhoto() {
  const profile = useStudentProfile((s) => s.profile)
  const profileStatus = useStudentProfile((s) => s.status)
  const loadProfile = useStudentProfile((s) => s.load)
  const [submission, setSubmission] = useState<PassPhotoSubmission | null>(null)
  const [loading, setLoading] = useState(true)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [idCardPreviewUrl, setIdCardPreviewUrl] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [idCardFile, setIdCardFile] = useState<File | null>(null)
  const [issues, setIssues] = useState<ClientValidationIssue[]>([])
  const [idCardIssues, setIdCardIssues] = useState<ClientValidationIssue[]>([])
  const [clientOk, setClientOk] = useState(false)
  const [idCardOk, setIdCardOk] = useState(false)
  const [checking, setChecking] = useState(false)
  const [idCardChecking, setIdCardChecking] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [consent, setConsent] = useState(false)
  const [avatarSaving, setAvatarSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const idCardInputRef = useRef<HTMLInputElement>(null)

  const passPhotoAllowed = isPassPhotoNavVisible(profile)

  const load = useCallback(async () => {
    if (!isPassPhotoApiEnabled() || !passPhotoAllowed) {
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
  }, [passPhotoAllowed])

  useEffect(() => {
    if (profileStatus === 'idle') void loadProfile()
  }, [profileStatus, loadProfile])

  useEffect(() => {
    if (profileStatus !== 'ready') return
    void load()
  }, [load, profileStatus])

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
      const clientResult = await validatePassPhotoClient(picked)
      if (!clientResult.ok) {
        setIssues(clientResult.issues)
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

  const onPickIdCard = async (picked: File | null) => {
    setError(null)
    setIdCardIssues([])
    setIdCardOk(false)
    if (idCardPreviewUrl) URL.revokeObjectURL(idCardPreviewUrl)
    setIdCardFile(null)
    setIdCardPreviewUrl(null)

    if (!picked) return

    const url = URL.createObjectURL(picked)
    setIdCardPreviewUrl(url)

    setIdCardChecking(true)
    try {
      const clientResult = await validateIdCardClient(picked)
      setIdCardIssues(clientResult.issues)
      setIdCardOk(clientResult.ok)
      if (clientResult.ok) {
        setIdCardFile(picked)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось проверить фото студенческого билета')
    } finally {
      setIdCardChecking(false)
    }
  }

  const onSubmit = async () => {
    if (!file || !idCardFile || !clientOk || !idCardOk || !consent) return
    setUploading(true)
    setError(null)
    try {
      const data = await uploadPassPhoto(file, idCardFile)
      setSubmission(data)
      setFile(null)
      setIdCardFile(null)
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      if (idCardPreviewUrl) URL.revokeObjectURL(idCardPreviewUrl)
      setPreviewUrl(null)
      setIdCardPreviewUrl(null)
      setIssues([])
      setIdCardIssues([])
      setClientOk(false)
      setIdCardOk(false)
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message)
        const withIssues = e as ApiError & { issues?: ClientValidationIssue[] }
        if (withIssues.issues?.length) {
          setIssues(
            withIssues.issues.map((i) => ({
              code: i.code ?? 'SERVER',
              severity: (i.severity ?? 'FAIL') as 'FAIL' | 'WARN',
              message: i.message,
            })),
          )
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

  if (profileStatus === 'ready' && !passPhotoAllowed) {
    return <Navigate to={paths.services} replace />
  }

  if (!isPassPhotoApiEnabled()) {
    return (
      <>
        <ScreenHeader title="Фото для пропуска" subtitle="Загрузка фото для пропуска в университет" />
        <Card padding="lg">
          <p>Сейчас загрузка фото недоступна. Попробуйте позже.</p>
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
        subtitle="Загрузите фото лица и фото студенческого билета. После проверки сотрудником лицо будет использовано для пропуска."
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
          {(submission.hasImage || submission.hasIdCardImage) && submission.id && (
            <div className={styles.currentPhotos}>
              {submission.hasImage ? (
                <figure className={styles.currentFigure}>
                  <img
                    className={styles.currentPhoto}
                    src={passPhotoImageUrl(submission.id)}
                    alt="Фото лица"
                  />
                  <figcaption>Лицо</figcaption>
                </figure>
              ) : null}
              {submission.hasIdCardImage ? (
                <figure className={styles.currentFigure}>
                  <img
                    className={styles.currentPhoto}
                    src={passPhotoImageUrl(submission.id, false, 'id-card')}
                    alt="Фото студенческого билета"
                  />
                  <figcaption>Студенческий билет</figcaption>
                </figure>
              ) : null}
            </div>
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
            <h2 className={styles.h2}>1. Фото лица</h2>

            <div className={styles.previewWrap}>
              {previewUrl ? (
                <img className={styles.preview} src={previewUrl} alt="Превью лица" />
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
              {checking ? 'Проверка…' : 'Выбрать фото лица'}
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

            <h2 className={styles.h2}>2. Фото студенческого билета</h2>
            <p className={styles.muted}>
              Нужно для проверки: на снимке должны быть видны фото, номер студенческого билета и ФИО.
            </p>

            <div className={styles.previewWrap}>
              {idCardPreviewUrl ? (
                <img
                  className={styles.preview}
                  src={idCardPreviewUrl}
                  alt="Превью студенческого билета"
                />
              ) : (
                <div className={styles.idCardPlaceholder}>
                  <span>Фото студенческого билета</span>
                </div>
              )}
            </div>

            <input
              ref={idCardInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/bmp,image/x-ms-bmp,.jpg,.jpeg,.bmp,.png"
              className={styles.fileInput}
              onChange={(e) => void onPickIdCard(e.target.files?.[0] ?? null)}
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => idCardInputRef.current?.click()}
              disabled={idCardChecking || uploading}
            >
              {idCardChecking ? 'Проверка…' : 'Выбрать фото студенческого билета'}
            </Button>

            {idCardIssues.length > 0 && (
              <ul className={styles.issues}>
                {idCardIssues.map((issue, idx) => (
                  <li
                    key={`id-${issue.code}-${idx}`}
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
              disabled={!file || !idCardFile || !clientOk || !idCardOk || !consent || uploading}
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
            <p className={styles.muted}>
              Можно отправить новое фото на проверку — форма ниже.
            </p>
          )}
        </Card>
      )}
    </>
  )
}
