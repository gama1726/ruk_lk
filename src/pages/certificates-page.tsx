/**
 * @file Справки: список, детали, скачивание, подача заявки (студент / родитель).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ApiError, apiGetBlob } from '@/apiClient'
import {
  cancelCertificate,
  CERTIFICATE_ACCEPT,
  CERTIFICATE_MAX_FILES,
  CERTIFICATE_TYPE_OPTIONS,
  certificateStatusLabel,
  getMyCertificate,
  listMyCertificates,
  submitCertificate,
  type CertificateRequest,
  type CertificateSummary,
  type CertificateType,
} from '@/certificates'
import { isPreviewFeaturesEnabled, useAppFeatures } from '@/features'
import { ComingSoon } from '@/pages/coming-soon'
import { Button, Card, Loader, LoadError, ScreenHeader } from '@/ui'
import styles from './certificates.module.css'

type Audience = 'student' | 'parent'

type Props = {
  audience: Audience
  title?: string
}

function attachmentPath(audience: Audience, requestId: string, attachmentId: string): string {
  const base = audience === 'parent' ? '/api/parent/certificates' : '/api/student/certificates'
  return `${base}/${requestId}/attachments/${attachmentId}`
}

async function downloadAttachment(audience: Audience, requestId: string, attachmentId: string) {
  const { blob, filename } = await apiGetBlob(attachmentPath(audience, requestId, attachmentId))
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename || 'attachment'
  a.click()
  URL.revokeObjectURL(url)
}

function formatBytes(size: number): string {
  if (size < 1024) return `${size} Б`
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} КБ`
  return `${(size / (1024 * 1024)).toFixed(1)} МБ`
}

function isPdfFile(file: File): boolean {
  return file.type.includes('pdf') || file.name.toLowerCase().endsWith('.pdf')
}

function isImageFile(file: File): boolean {
  return file.type.startsWith('image/') || /\.(jpe?g|png|heic|heif|webp)$/i.test(file.name)
}

function StatusBadge({ status }: { status: string }) {
  const label = certificateStatusLabel(status)
  const cls =
    status === 'APPROVED'
      ? styles.badgeApproved
      : status === 'REJECTED'
        ? styles.badgeRejected
        : status === 'CANCELLED'
          ? styles.badgeCancelled
          : styles.badgePending
  return <span className={`${styles.badge} ${cls}`}>{label}</span>
}

export function CertificatesPage({ audience, title = 'Справки' }: Props) {
  const featuresStatus = useAppFeatures((s) => s.status)
  const loadFeatures = useAppFeatures((s) => s.load)
  const preview = useAppFeatures((s) => s.features?.previewEnabled === true)
  const inputRef = useRef<HTMLInputElement>(null)

  const [items, setItems] = useState<CertificateSummary[]>([])
  const [selected, setSelected] = useState<CertificateRequest | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [type, setType] = useState<CertificateType>('SICK_LEAVE')
  const [comment, setComment] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [detailError, setDetailError] = useState<string | null>(null)

  const previewUrls = useMemo(() => {
    return files.map((file) => (isImageFile(file) && !isPdfFile(file) ? URL.createObjectURL(file) : null))
  }, [files])

  useEffect(() => {
    return () => {
      for (const url of previewUrls) {
        if (url) URL.revokeObjectURL(url)
      }
    }
  }, [previewUrls])

  useEffect(() => {
    if (featuresStatus === 'idle') void loadFeatures()
  }, [featuresStatus, loadFeatures])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setItems(await listMyCertificates(audience))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось загрузить справки')
    } finally {
      setLoading(false)
    }
  }, [audience])

  useEffect(() => {
    if (featuresStatus !== 'ready') return
    if (!isPreviewFeaturesEnabled()) {
      setLoading(false)
      return
    }
    void load()
  }, [featuresStatus, load, preview])

  if (featuresStatus !== 'ready') return <Loader />
  if (!preview) {
    return <ComingSoon title={title} note="Раздел пока доступен тестовым учёткам" />
  }

  const addFiles = (list: FileList | null) => {
    setFormError(null)
    if (!list || list.length === 0) return
    setFiles((prev) => {
      const merged = [...prev, ...Array.from(list)]
      return merged.slice(0, CERTIFICATE_MAX_FILES)
    })
    if (inputRef.current) inputRef.current.value = ''
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const onSubmit = async () => {
    setFormError(null)
    if (files.length === 0) {
      setFormError('Прикрепите хотя бы один файл (PDF, JPG, PNG, HEIC)')
      return
    }
    setSubmitting(true)
    try {
      await submitCertificate(audience, type, comment, files)
      setComment('')
      setFiles([])
      setSelected(null)
      await load()
    } catch (err) {
      setFormError(err instanceof ApiError || err instanceof Error ? err.message : 'Не удалось отправить')
    } finally {
      setSubmitting(false)
    }
  }

  const onCancel = async (id: string) => {
    setBusyId(id)
    try {
      await cancelCertificate(audience, id)
      if (selected?.id === id) setSelected(null)
      await load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось отозвать')
    } finally {
      setBusyId(null)
    }
  }

  const openDetail = async (id: string) => {
    setDetailError(null)
    setBusyId(id)
    try {
      setSelected(await getMyCertificate(audience, id))
    } catch (err) {
      setDetailError(err instanceof ApiError ? err.message : 'Не удалось открыть заявку')
    } finally {
      setBusyId(null)
    }
  }

  const onDownload = async (requestId: string, attachmentId: string) => {
    setDetailError(null)
    try {
      await downloadAttachment(audience, requestId, attachmentId)
    } catch (err) {
      setDetailError(err instanceof ApiError ? err.message : 'Не удалось скачать файл')
    }
  }

  return (
    <div className={styles.stack}>
      <div>
        <ScreenHeader title={title} />
        <p className={styles.lead}>
          Загрузите справку (больничный, военкомат или другое). Период отсутствия укажет сотрудник
          после проверки.
        </p>
      </div>

      <Card padding="lg">
        <h2 className={styles.h2}>Новая заявка</h2>
        <ol className={styles.steps}>
          <li>Выберите тип справки</li>
          <li>Прикрепите файл (или несколько)</li>
          <li>Отправьте на проверку — сотрудник укажет период отсутствия</li>
        </ol>

        <div className={styles.form}>
          <label className={styles.field}>
            Тип
            <select
              className={styles.control}
              value={type}
              onChange={(e) => setType(e.target.value as CertificateType)}
              disabled={submitting}
            >
              {CERTIFICATE_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            Комментарий (необязательно)
            <textarea
              className={`${styles.control} ${styles.textarea}`}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={submitting}
              rows={3}
              placeholder="Например: справка с 10 по 12 марта"
            />
          </label>

          <div className={styles.field}>
            <span>Файлы</span>
            <p className={styles.hint}>
              До {CERTIFICATE_MAX_FILES} файлов · PDF, JPG, PNG, HEIC · до 50 МБ каждый
            </p>
            <input
              ref={inputRef}
              type="file"
              accept={CERTIFICATE_ACCEPT}
              multiple
              disabled={submitting || files.length >= CERTIFICATE_MAX_FILES}
              className={styles.fileInput}
              onChange={(e) => addFiles(e.target.files)}
            />
            <div className={styles.fileRow}>
              <Button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={submitting || files.length >= CERTIFICATE_MAX_FILES}
              >
                Загрузить файл справки
              </Button>
              {files.length > 0 ? (
                <span className={styles.hint}>
                  Выбрано: {files.length} из {CERTIFICATE_MAX_FILES}
                </span>
              ) : (
                <span className={styles.hint}>Файл ещё не выбран</span>
              )}
            </div>

            {files.length > 0 ? (
              <ul className={styles.fileList}>
                {files.map((file, index) => (
                  <li key={`${file.name}-${file.size}-${index}`} className={styles.fileItem}>
                    {previewUrls[index] ? (
                      <img src={previewUrls[index]!} alt="" className={styles.thumb} />
                    ) : (
                      <span className={styles.pdfBadge}>{isPdfFile(file) ? 'PDF' : 'FILE'}</span>
                    )}
                    <div className={styles.fileMeta}>
                      <div className={styles.fileName}>{file.name}</div>
                      <div className={styles.fileSize}>{formatBytes(file.size)}</div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      disabled={submitting}
                    >
                      Удалить
                    </Button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          {formError ? <p className={styles.error}>{formError}</p> : null}

          <div className={styles.actions}>
            <Button
              type="button"
              onClick={() => void onSubmit()}
              disabled={submitting || files.length === 0}
              loading={submitting}
            >
              {submitting ? 'Отправка…' : 'Отправить на проверку'}
            </Button>
          </div>
        </div>
      </Card>

      {loading ? <Loader /> : null}
      {error ? <LoadError message={error} onRetry={() => void load()} /> : null}

      {!loading && !error ? (
        <Card padding="lg">
          <h2 className={styles.h2}>Мои заявки</h2>
          {items.length === 0 ? (
            <p className={styles.empty}>Пока нет заявок. Загрузите справку выше.</p>
          ) : (
            <ul className={styles.list}>
              {items.map((item) => (
                <li key={item.id} className={styles.item}>
                  <div className={styles.itemHead}>
                    <span className={styles.itemTitle}>{item.typeLabel}</span>
                    <StatusBadge status={item.status} />
                  </div>
                  <div className={styles.itemMeta}>
                    {new Date(item.createdAt).toLocaleString('ru-RU')}
                  </div>
                  {item.status === 'APPROVED' && item.approvedFrom && item.approvedTo ? (
                    <div className={styles.itemPeriod}>
                      Период отсутствия: {item.approvedFrom} — {item.approvedTo}
                    </div>
                  ) : null}
                  {item.status === 'REJECTED' && item.rejectionReason ? (
                    <div className={styles.rejectBox}>Причина отклонения: {item.rejectionReason}</div>
                  ) : null}
                  <div className={styles.actions}>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => void openDetail(item.id)}
                      disabled={busyId === item.id}
                    >
                      Открыть
                    </Button>
                    {item.status === 'PENDING' ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => void onCancel(item.id)}
                        disabled={busyId === item.id}
                      >
                        Отозвать
                      </Button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      ) : null}

      {selected ? (
        <Card padding="lg">
          <div className={styles.detailHead}>
            <div className={styles.itemHead}>
              <h2>{selected.typeLabel}</h2>
              <StatusBadge status={selected.status} />
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={() => setSelected(null)}>
              Закрыть
            </Button>
          </div>
          {selected.comment ? (
            <p className={styles.detailBlock}>Комментарий: {selected.comment}</p>
          ) : null}
          {selected.status === 'APPROVED' && selected.approvedFrom && selected.approvedTo ? (
            <p className={styles.detailBlock}>
              Период отсутствия: {selected.approvedFrom} — {selected.approvedTo}
            </p>
          ) : null}
          {selected.status === 'REJECTED' && selected.rejectionReason ? (
            <div className={styles.rejectBox}>Причина отклонения: {selected.rejectionReason}</div>
          ) : null}
          <h3 className={styles.h2}>Вложения</h3>
          {selected.attachments.length === 0 ? (
            <p className={styles.empty}>Файлы удалены по сроку хранения.</p>
          ) : (
            <ul className={styles.attachList}>
              {selected.attachments.map((a) => (
                <li key={a.id} className={styles.attachItem}>
                  <span className={styles.fileMeta}>
                    <span className={styles.fileName}>{a.originalFilename}</span>
                    <span className={styles.fileSize}>{formatBytes(a.sizeBytes)}</span>
                  </span>
                  <Button type="button" size="sm" onClick={() => void onDownload(selected.id, a.id)}>
                    Скачать
                  </Button>
                </li>
              ))}
            </ul>
          )}
          {detailError ? <p className={styles.error}>{detailError}</p> : null}
        </Card>
      ) : null}
    </div>
  )
}

export function StudentCertificatesPage() {
  return <CertificatesPage audience="student" />
}

export function ParentCertificatesPage() {
  return <CertificatesPage audience="parent" title="Справки ребёнка" />
}
