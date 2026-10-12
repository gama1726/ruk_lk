/**
 * @file Справки: список и подача заявки (студент или родитель, preview allowlist).
 */

import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/apiClient'
import {
  cancelCertificate,
  CERTIFICATE_ACCEPT,
  CERTIFICATE_MAX_FILES,
  CERTIFICATE_TYPE_OPTIONS,
  certificateStatusLabel,
  listMyCertificates,
  submitCertificate,
  type CertificateSummary,
  type CertificateType,
} from '@/certificates'
import { isPreviewFeaturesEnabled, useAppFeatures } from '@/features'
import { ComingSoon } from '@/pages/coming-soon'
import { Button, Card, Loader, LoadError, ScreenHeader } from '@/ui'

type Audience = 'student' | 'parent'

type Props = {
  audience: Audience
  title?: string
}

export function CertificatesPage({ audience, title = 'Справки' }: Props) {
  const featuresStatus = useAppFeatures((s) => s.status)
  const loadFeatures = useAppFeatures((s) => s.load)
  const preview = useAppFeatures((s) => s.features?.previewEnabled === true)

  const [items, setItems] = useState<CertificateSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [type, setType] = useState<CertificateType>('SICK_LEAVE')
  const [comment, setComment] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

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

  const onFiles = (list: FileList | null) => {
    setFormError(null)
    if (!list) {
      setFiles([])
      return
    }
    const next = Array.from(list).slice(0, CERTIFICATE_MAX_FILES)
    setFiles(next)
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
      await load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Не удалось отозвать')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div>
      <ScreenHeader title={title} />
      <p style={{ marginBottom: '1.25rem', opacity: 0.8 }}>
        Загрузите справку (больничный, военкомат или другое). Период отсутствия укажет сотрудник
        после проверки.
      </p>

      <Card style={{ marginBottom: '1.25rem' }}>
        <h2 style={{ marginTop: 0 }}>Новая заявка</h2>
        <label style={{ display: 'block', marginBottom: 8 }}>
          Тип
          <select
            value={type}
            onChange={(e) => setType(e.target.value as CertificateType)}
            disabled={submitting}
            style={{ display: 'block', marginTop: 4, width: '100%', maxWidth: 360 }}
          >
            {CERTIFICATE_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: 'block', marginBottom: 8 }}>
          Комментарий (необязательно)
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={submitting}
            rows={3}
            style={{ display: 'block', marginTop: 4, width: '100%', maxWidth: 480 }}
          />
        </label>
        <label style={{ display: 'block', marginBottom: 8 }}>
          Файлы (до {CERTIFICATE_MAX_FILES}, PDF/JPG/PNG/HEIC, до 50 МБ)
          <input
            type="file"
            accept={CERTIFICATE_ACCEPT}
            multiple
            disabled={submitting}
            onChange={(e) => onFiles(e.target.files)}
            style={{ display: 'block', marginTop: 4 }}
          />
        </label>
        {files.length > 0 ? (
          <ul>
            {files.map((f) => (
              <li key={`${f.name}-${f.size}`}>{f.name}</li>
            ))}
          </ul>
        ) : null}
        {formError ? <p style={{ color: 'var(--color-danger, #b00020)' }}>{formError}</p> : null}
        <Button type="button" onClick={() => void onSubmit()} disabled={submitting}>
          {submitting ? 'Отправка…' : 'Отправить на проверку'}
        </Button>
      </Card>

      {loading ? <Loader /> : null}
      {error ? <LoadError message={error} onRetry={() => void load()} /> : null}

      {!loading && !error ? (
        <Card>
          <h2 style={{ marginTop: 0 }}>Мои заявки</h2>
          {items.length === 0 ? (
            <p style={{ opacity: 0.75 }}>Пока нет заявок.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {items.map((item) => (
                <li
                  key={item.id}
                  style={{
                    borderTop: '1px solid rgba(0,0,0,0.08)',
                    padding: '0.75rem 0',
                  }}
                >
                  <div>
                    <strong>{item.typeLabel}</strong> · {certificateStatusLabel(item.status)}
                  </div>
                  <div style={{ opacity: 0.75, fontSize: '0.9rem' }}>
                    {new Date(item.createdAt).toLocaleString('ru-RU')}
                  </div>
                  {item.status === 'APPROVED' && item.approvedFrom && item.approvedTo ? (
                    <div style={{ fontSize: '0.9rem' }}>
                      Период: {item.approvedFrom} — {item.approvedTo}
                    </div>
                  ) : null}
                  {item.status === 'REJECTED' && item.rejectionReason ? (
                    <div style={{ fontSize: '0.9rem' }}>Причина: {item.rejectionReason}</div>
                  ) : null}
                  {item.status === 'PENDING' ? (
                    <Button
                      type="button"
                      onClick={() => void onCancel(item.id)}
                      disabled={busyId === item.id}
                      style={{ marginTop: 8 }}
                    >
                      Отозвать
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
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
