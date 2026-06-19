/**
 * @file Обходной лист при отчислении/выпуске (мок).
 */

export type BypassStepStatus = 'signed' | 'pending' | 'blocked'

export type BypassStep = {
  id: string
  department: string
  status: BypassStepStatus
  signedAt?: string
  comment?: string
}

export type BypassSheet = {
  id: string
  purpose: string
  openedAt: string
  steps: BypassStep[]
}

export const bypassStatusLabel: Record<BypassStepStatus, string> = {
  signed: 'подписано',
  pending: 'ожидает',
  blocked: 'заблокировано',
}

/** Обходной лист на выпуск — часть подписей уже стоит */
export const bypassSheet: BypassSheet = {
  id: 'bp-2026-014',
  purpose: 'Выпуск · бакалавриат 2027',
  openedAt: '2026-06-01',
  steps: [
    { id: 's1', department: 'Библиотека', status: 'signed', signedAt: '2026-06-03', comment: 'Задолженностей нет' },
    { id: 's2', department: 'Деканат', status: 'signed', signedAt: '2026-06-05' },
    { id: 's3', department: 'Бухгалтерия', status: 'pending', comment: 'Проверка оплаты за 2 семестр' },
    { id: 's4', department: 'Общежитие', status: 'pending' },
    { id: 's5', department: 'Военный учёт', status: 'pending' },
    { id: 's6', department: 'Центр карьеры', status: 'blocked', comment: 'Сначала закройте задолженности' },
  ],
}

/**
 * @param steps - шаги обходного листа
 * @returns доля подписанных шагов 0–100
 */
export function bypassProgress(steps: BypassStep[]): number {
  if (steps.length === 0) return 0
  const signed = steps.filter((s) => s.status === 'signed').length
  return Math.round((signed / steps.length) * 100)
}

/**
 * @param iso - `YYYY-MM-DD`
 */
export function formatBypassDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' }).format(new Date(y, m - 1, d))
}
