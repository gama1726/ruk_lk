/**
 * @file Справки: форма, история, детали, повторная подача (студент / родитель).
 */

import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from 'react'
import { ApiError, apiGetBlob } from '@/apiClient'
import {
  cancelCertificate,
  CERTIFICATE_ACCEPT,
  CERTIFICATE_MAX_BYTES,
  CERTIFICATE_MAX_FILES,
  CERTIFICATE_TYPE_OPTIONS,
  certificateStatusLabel,
  getMyCertificate,
  listMyCertificates,
  submitCertificate,
  type CertificateAttachment,
  type CertificateRequest,
  type CertificateSummary,
  type CertificateType,
} from '@/certificates'
import { isPreviewFeaturesEnabled, useAppFeatures } from '@/features'
import { ComingSoon } from '@/pages/coming-soon'
import { Button, Loader, LoadError, Modal, ScreenHeader } from '@/ui'
import styles from './certificates.module.css'

type Audience = 'student' | 'parent'
type HistoryTab = 'all' | 'pending' | 'approved' | 'rejected'

const PAGE_SIZE = 8

type Props = {
  audience: Audience
  title?: string
}

function attachmentPath(audience: Audience, requestId: string, attachmentId: string): string {
  const base = audience === 'parent' ? '/api/parent/certificates' : '/api/student/certificates'
  return `${base}/${requestId}/attachments/${attachmentId}`
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

function isAllowedFile(file: File): boolean {
  const name = file.name.toLowerCase()
  const type = (file.type || '').toLowerCase()
  if (type.includes('pdf') || name.endsWith('.pdf')) return true
  if (/\.(jpe?g|png|heic|heif|webp)$/i.test(name)) return true
  if (type.startsWith('image/')) return true
  return false
}

function isImageAttachment(a: CertificateAttachment): boolean {
  return (a.contentType || '').startsWith('image/') || /\.(jpe?g|png|webp|gif)$/i.test(a.originalFilename)
}

function isPdfAttachment(a: CertificateAttachment): boolean {
  return (a.contentType || '').includes('pdf') || /\.pdf$/i.test(a.originalFilename)
}

function asCertificateType(value: string): CertificateType {
  if (value === 'MILITARY_EXEMPTION' || value === 'OTHER' || value === 'SICK_LEAVE') return value
  return 'SICK_LEAVE'
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

function RejectReason({ reason }: { reason: string }) {
  return (
    <div className={styles.rejectBox}>
      <p className={styles.rejectLabel}>
        <span className={styles.rejectIcon} aria-hidden="true">
          !
        </span>
        Причина отклонения
      </p>
      <p className={styles.rejectText}>{reason}</p>
    </div>
  )
}

export function CertificatesPage({ audience, title = 'Мои справки' }: Props) {
  const featuresStatus = useAppFeatures((s) => s.status)
  const loadFeatures = useAppFeatures((s) => s.load)
  const preview = useAppFeatures((s) => s.features?.previewEnabled === true)
  const inputRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLDivElement>(null)

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
  const [tab, setTab] = useState<HistoryTab>('all')
  const [page, setPage] = useState(1)
  const [dragOver, setDragOver] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [resubmitHint, setResubmitHint] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewKind, setPreviewKind] = useState<'image' | 'pdf' | null>(null)
  const [previewAttachmentId, setPreviewAttachmentId] = useState<string | null>(null)

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
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  useEffect(() => {
    if (featuresStatus === 'idle') void loadFeatures()
  }, [featuresStatus, loadFeatures])

  const showToast = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(null), 3200)
  }

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

  const counts = useMemo(() => {
    const pending = items.filter((i) => i.status === 'PENDING').length
    const approved = items.filter((i) => i.status === 'APPROVED').length
    const rejected = items.filter((i) => i.status === 'REJECTED').length
    return { pending, approved, rejected }
  }, [items])

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (tab === 'pending') return item.status === 'PENDING'
      if (tab === 'approved') return item.status === 'APPROVED'
      if (tab === 'rejected') return item.status === 'REJECTED'
      return true
    })
  }, [items, tab])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageSafe = Math.min(page, totalPages)
  const paged = filtered.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE)

  useEffect(() => {
    setPage(1)
  }, [tab])

  if (featuresStatus !== 'ready') return <Loader />
  if (!preview) {
    return <ComingSoon title={title} note="Раздел пока доступен тестовым учёткам" />
  }

  const clearDetailPreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setPreviewKind(null)
    setPreviewAttachmentId(null)
  }

  const addFiles = (list: FileList | File[] | null) => {
    setFormError(null)
    if (!list || (Array.isArray(list) ? list.length === 0 : list.length === 0)) return
    const incoming = Array.from(list as ArrayLike<File>)
    const accepted: File[] = []
    for (const file of incoming) {
      if (!isAllowedFile(file)) {
        setFormError(`Неподдерживаемый формат: ${file.name}`)
        continue
      }
      if (file.size > CERTIFICATE_MAX_BYTES) {
        setFormError(`Файл больше 50 МБ: ${file.name}`)
        continue
      }
      accepted.push(file)
    }
    if (accepted.length === 0) return
    setFiles((prev) => {
      const room = CERTIFICATE_MAX_FILES - prev.length
      if (room <= 0) {
        setFormError(`Можно прикрепить не больше ${CERTIFICATE_MAX_FILES} файлов`)
        return prev
      }
      const next = [...prev, ...accepted.slice(0, room)]
      if (accepted.length > room) {
        setFormError(`Добавлены только первые ${room} файл(ов) — лимит ${CERTIFICATE_MAX_FILES}`)
      }
      return next
    })
    if (inputRef.current) inputRef.current.value = ''
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragOver(false)
    if (submitting || files.length >= CERTIFICATE_MAX_FILES) return
    addFiles(e.dataTransfer.files)
  }

  const onSubmit = async () => {
    setFormError(null)
    if (files.length === 0) {
      setFormError('Прикрепите хотя бы один файл (PDF, JPG, PNG, HEIC)')
      return
    }
    if (submitting) return
    setSubmitting(true)
    try {
      await submitCertificate(audience, type, comment, files)
      setComment('')
      setFiles([])
      setResubmitHint(null)
      setSelected(null)
      clearDetailPreview()
      await load()
      showToast('Заявка отправлена на проверку')
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
      if (selected?.id === id) {
        setSelected(null)
        clearDetailPreview()
      }
      await load()
      showToast('Заявка отозвана')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось отозвать')
    } finally {
      setBusyId(null)
    }
  }

  const loadAttachmentPreview = async (requestId: string, attachment: CertificateAttachment) => {
    clearDetailPreview()
    if (!isImageAttachment(attachment) && !isPdfAttachment(attachment)) return
    try {
      const { blob } = await apiGetBlob(attachmentPath(audience, requestId, attachment.id))
      const url = URL.createObjectURL(blob)
      setPreviewUrl(url)
      setPreviewKind(isPdfAttachment(attachment) ? 'pdf' : 'image')
      setPreviewAttachmentId(attachment.id)
    } catch {
      // превью необязательно
    }
  }

  const openDetail = async (id: string) => {
    setDetailError(null)
    setBusyId(id)
    clearDetailPreview()
    try {
      const detail = await getMyCertificate(audience, id)
      setSelected(detail)
      const first = detail.attachments[0]
      if (first) await loadAttachmentPreview(detail.id, first)
    } catch (err) {
      setDetailError(err instanceof ApiError ? err.message : 'Не удалось открыть заявку')
    } finally {
      setBusyId(null)
    }
  }

  const onDownload = async (requestId: string, attachmentId: string, filename: string) => {
    setDetailError(null)
    try {
      const { blob, filename: serverName } = await apiGetBlob(
        attachmentPath(audience, requestId, attachmentId),
      )
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = serverName || filename || 'attachment'
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setDetailError(err instanceof ApiError ? err.message : 'Не удалось скачать файл')
    }
  }

  const applyResubmit = (typeValue: string, commentValue: string | null | undefined, reason: string | null | undefined) => {
    setType(asCertificateType(typeValue))
    setComment(commentValue ?? '')
    setFiles([])
    setFormError(null)
    setResubmitHint(reason ?? 'Исправьте замечания и приложите новые файлы')
    setSelected(null)
    clearDetailPreview()
    setTab('all')
    window.requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const startResubmit = async (source: CertificateSummary | CertificateRequest) => {
    if ('attachments' in source) {
      applyResubmit(source.type, source.comment, source.rejectionReason)
      return
    }
    setBusyId(source.id)
    try {
      const detail = await getMyCertificate(audience, source.id)
      applyResubmit(detail.type, detail.comment, detail.rejectionReason ?? source.rejectionReason)
    } catch {
      applyResubmit(source.type, '', source.rejectionReason)
    } finally {
      setBusyId(null)
    }
  }

  const setHistoryTab = (next: HistoryTab) => {
    setTab(next)
  }

  const canDrop = !submitting && files.length < CERTIFICATE_MAX_FILES

  return (
    <div className={styles.page}>
      <div>
        <ScreenHeader title={title} />
        <p className={styles.lead}>
          Загружайте документы, подтверждающие уважительные причины отсутствия на занятиях.
        </p>
      </div>

      <div className={styles.stats}>
        <button
          type="button"
          className={`${styles.stat} ${tab === 'pending' ? styles.statActive : ''}`}
          onClick={() => setHistoryTab('pending')}
        >
          <p className={styles.statLabel}>На проверке</p>
          <p className={`${styles.statValue} ${styles.statPending}`}>{counts.pending}</p>
        </button>
        <button
          type="button"
          className={`${styles.stat} ${tab === 'approved' ? styles.statActive : ''}`}
          onClick={() => setHistoryTab('approved')}
        >
          <p className={styles.statLabel}>Принято</p>
          <p className={`${styles.statValue} ${styles.statApproved}`}>{counts.approved}</p>
        </button>
        <button
          type="button"
          className={`${styles.stat} ${tab === 'rejected' ? styles.statActive : ''}`}
          onClick={() => setHistoryTab('rejected')}
        >
          <p className={styles.statLabel}>Отклонено</p>
          <p className={`${styles.statValue} ${styles.statRejected}`}>{counts.rejected}</p>
        </button>
      </div>

      <section className={styles.process} aria-label="Как проходит проверка">
        <h2 className={styles.processTitle}>Как проходит проверка</h2>
        <ol className={styles.processList}>
          <li className={styles.processItem}>
            <span className={styles.processNum}>1</span>
            <div>
              <p className={styles.processItemTitle}>Вы загружаете документ</p>
              <p className={styles.processItemText}>Выбираете тип справки и прикладываете файл.</p>
            </div>
          </li>
          <li className={styles.processItem}>
            <span className={styles.processNum}>2</span>
            <div>
              <p className={styles.processItemTitle}>Сотрудник проверяет справку</p>
              <p className={styles.processItemText}>
                Проверяет документ и указывает подтверждённый период отсутствия.
              </p>
            </div>
          </li>
          <li className={styles.processItem}>
            <span className={styles.processNum}>3</span>
            <div>
              <p className={styles.processItemTitle}>Вы видите результат</p>
              <p className={styles.processItemText}>
                Статус, подтверждённые даты или причину отклонения.
              </p>
            </div>
          </li>
        </ol>
      </section>

      <div className={styles.card} ref={formRef}>
        <div className={styles.cardHead}>
          <h2 className={styles.h2}>Новая заявка</h2>
          <span className={styles.stepBadge}>Шаг 1 из 2</span>
        </div>

        {resubmitHint ? (
          <div className={styles.resubmitBanner}>
            <strong>Повторная подача</strong>
            {resubmitHint}
            <div className={styles.actions}>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setResubmitHint(null)}
                disabled={submitting}
              >
                Скрыть
              </Button>
            </div>
          </div>
        ) : null}

        <div className={styles.form}>
          <label className={styles.field}>
            Тип справки
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
              placeholder="Например, справка за период с 10 по 12 марта"
            />
          </label>

          <div className={styles.field}>
            <span>Документы</span>
            <p className={styles.hint}>
              До {CERTIFICATE_MAX_FILES} файлов · PDF, JPG, PNG, HEIC · до 50 МБ каждый
            </p>
            <input
              ref={inputRef}
              type="file"
              accept={CERTIFICATE_ACCEPT}
              multiple
              disabled={!canDrop}
              className={styles.fileInput}
              onChange={(e) => addFiles(e.target.files)}
            />
            <div
              className={`${styles.dropzone} ${dragOver ? styles.dropzoneActive : ''} ${
                !canDrop ? styles.dropzoneDisabled : ''
              }`}
              role="button"
              tabIndex={canDrop ? 0 : -1}
              onClick={() => {
                if (canDrop) inputRef.current?.click()
              }}
              onKeyDown={(e) => {
                if (!canDrop) return
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  inputRef.current?.click()
                }
              }}
              onDragEnter={(e) => {
                e.preventDefault()
                if (canDrop) setDragOver(true)
              }}
              onDragOver={(e) => {
                e.preventDefault()
                if (canDrop) setDragOver(true)
              }}
              onDragLeave={(e) => {
                e.preventDefault()
                setDragOver(false)
              }}
              onDrop={onDrop}
            >
              <span className={styles.dropIcon} aria-hidden="true">
                ↑
              </span>
              <p className={styles.dropTitle}>Перетащите файлы сюда или нажмите для выбора</p>
              <p className={styles.dropHint}>
                Выбрано: {files.length} из {CERTIFICATE_MAX_FILES}
              </p>
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
      </div>

      {loading ? <Loader /> : null}
      {error ? <LoadError message={error} onRetry={() => void load()} /> : null}

      {!loading && !error ? (
        <section>
          <div className={styles.sectionHead}>
            <h2 className={styles.h2}>История заявок</h2>
            <div className={styles.tabs}>
              {(
                [
                  ['all', 'Все'],
                  ['pending', 'На проверке'],
                  ['approved', 'Принятые'],
                  ['rejected', 'Отклонённые'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={`${styles.tab} ${tab === id ? styles.tabActive : ''}`}
                  onClick={() => setHistoryTab(id)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className={styles.empty}>
              {tab === 'all' ? 'Пока нет заявок. Загрузите справку выше.' : 'В этом фильтре заявок нет.'}
            </p>
          ) : (
            <>
              <ul className={styles.list}>
                {paged.map((item) => (
                  <li key={item.id} className={styles.item}>
                    <div className={styles.itemHead}>
                      <span className={styles.itemTitle}>{item.typeLabel}</span>
                      <StatusBadge status={item.status} />
                    </div>
                    <div className={styles.itemMeta}>
                      Подана {new Date(item.createdAt).toLocaleString('ru-RU')}
                    </div>
                    {item.status === 'APPROVED' && item.approvedFrom && item.approvedTo ? (
                      <div className={styles.itemPeriod}>
                        Период отсутствия: {item.approvedFrom} — {item.approvedTo}
                      </div>
                    ) : null}
                    {item.status === 'REJECTED' && item.rejectionReason ? (
                      <RejectReason reason={item.rejectionReason} />
                    ) : null}
                    <div className={styles.actions}>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => void openDetail(item.id)}
                        disabled={busyId === item.id}
                      >
                        Подробнее
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
                      {item.status === 'REJECTED' ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => void startResubmit(item)}
                          disabled={busyId === item.id}
                        >
                          Подать повторно
                        </Button>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>

              {filtered.length > PAGE_SIZE ? (
                <div className={styles.pager}>
                  <span className={styles.pagerInfo}>
                    Стр. {pageSafe} из {totalPages} · {filtered.length} заявок
                  </span>
                  <div className={styles.actions}>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={pageSafe <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Назад
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      disabled={pageSafe >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    >
                      Далее
                    </Button>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </section>
      ) : null}

      <Modal
        open={Boolean(selected)}
        title={selected?.typeLabel ?? 'Заявка'}
        onClose={() => {
          setSelected(null)
          clearDetailPreview()
        }}
        footer={
          selected ? (
            <>
              {selected.status === 'REJECTED' ? (
                <Button type="button" onClick={() => void startResubmit(selected)}>
                  Подать повторно
                </Button>
              ) : null}
              {selected.status === 'PENDING' ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => void onCancel(selected.id)}
                  disabled={busyId === selected.id}
                >
                  Отозвать
                </Button>
              ) : null}
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setSelected(null)
                  clearDetailPreview()
                }}
              >
                Закрыть
              </Button>
            </>
          ) : undefined
        }
      >
        {selected ? (
          <>
            <div className={styles.detailSection}>
              <p className={styles.detailSectionTitle}>Статус</p>
              <StatusBadge status={selected.status} />
              <p className={styles.detailBlock}>
                Подана: {new Date(selected.createdAt).toLocaleString('ru-RU')}
              </p>
            </div>

            {selected.comment ? (
              <div className={styles.detailSection}>
                <p className={styles.detailSectionTitle}>Комментарий</p>
                <p className={styles.detailBlock}>{selected.comment}</p>
              </div>
            ) : null}

            {selected.status === 'APPROVED' && selected.approvedFrom && selected.approvedTo ? (
              <div className={styles.detailSection}>
                <p className={styles.detailSectionTitle}>Подтверждённый период</p>
                <p className={styles.detailBlock}>
                  {selected.approvedFrom} — {selected.approvedTo}
                </p>
              </div>
            ) : (
              <div className={styles.detailSection}>
                <p className={styles.detailSectionTitle}>Период отсутствия</p>
                <p className={styles.detailBlock}>
                  Указывает сотрудник после проверки документа.
                </p>
              </div>
            )}

            {selected.status === 'REJECTED' && selected.rejectionReason ? (
              <div className={styles.detailSection}>
                <RejectReason reason={selected.rejectionReason} />
              </div>
            ) : null}

            <div className={styles.detailSection}>
              <p className={styles.detailSectionTitle}>Документы</p>
              {selected.attachments.length === 0 ? (
                <p className={styles.empty}>Файлы удалены по сроку хранения.</p>
              ) : (
                <ul className={styles.attachList}>
                  {selected.attachments.map((a) => (
                    <li key={a.id} className={styles.attachItem}>
                      <div className={styles.attachRow}>
                        <span className={styles.fileMeta}>
                          <span className={styles.fileName}>{a.originalFilename}</span>
                          <span className={styles.fileSize}>{formatBytes(a.sizeBytes)}</span>
                        </span>
                        <div className={styles.actions}>
                          {(isImageAttachment(a) || isPdfAttachment(a)) &&
                          previewAttachmentId !== a.id ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              onClick={() => void loadAttachmentPreview(selected.id, a)}
                            >
                              Просмотр
                            </Button>
                          ) : null}
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => void onDownload(selected.id, a.id, a.originalFilename)}
                          >
                            Скачать
                          </Button>
                        </div>
                      </div>
                      {previewUrl && previewKind === 'image' && previewAttachmentId === a.id ? (
                        <img src={previewUrl} alt="" className={styles.preview} />
                      ) : null}
                      {previewUrl && previewKind === 'pdf' && previewAttachmentId === a.id ? (
                        <iframe title="PDF" src={previewUrl} className={styles.pdfFrame} />
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {detailError ? <p className={styles.error}>{detailError}</p> : null}
          </>
        ) : null}
      </Modal>

      {toast ? <div className={styles.toast}>{toast}</div> : null}
    </div>
  )
}

export function StudentCertificatesPage() {
  return <CertificatesPage audience="student" title="Мои справки" />
}

export function ParentCertificatesPage() {
  return <CertificatesPage audience="parent" title="Справки ребёнка" />
}
