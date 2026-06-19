/**
 * @file Общежитие: проживание, заявки, обращения (мок).
 * @remarks Данные привязаны к аккаунту, не к программе.
 */

export type ResidenceStatus = 'active' | 'none' | 'pending'

export type DormApplication = {
  id: string
  type: string
  createdAt: string
  status: 'sent' | 'processing' | 'approved' | 'rejected'
}

export type HouseholdTicket = {
  id: string
  topic: string
  createdAt: string
  status: 'open' | 'processing' | 'closed'
  reply?: string
}

export type DormitoryInfo = {
  status: ResidenceStatus
  building?: string
  room?: string
  contractNumber?: string
  contractUntil?: string
  applications: DormApplication[]
  tickets: HouseholdTicket[]
}

export const applicationStatusLabel: Record<DormApplication['status'], string> = {
  sent: 'отправлено',
  processing: 'в обработке',
  approved: 'одобрено',
  rejected: 'отказано',
}

export const ticketStatusLabel: Record<HouseholdTicket['status'], string> = {
  open: 'открыто',
  processing: 'в работе',
  closed: 'закрыто',
}

/** Студент проживает в общежитии РУК */
export const dormitory: DormitoryInfo = {
  status: 'active',
  building: 'Общежитие №2, корпус А',
  room: '314',
  contractNumber: 'ОБ-2024/0318',
  contractUntil: '2026-08-31',
  applications: [
    {
      id: 'dorm-app-12',
      type: 'Продление договора на 2026/27',
      createdAt: '2026-05-28',
      status: 'processing',
    },
    {
      id: 'dorm-app-08',
      type: 'Заселение на новый учебный год',
      createdAt: '2025-08-15',
      status: 'approved',
    },
  ],
  tickets: [
    {
      id: 'dorm-t-44',
      topic: 'Не работает розетка у окна',
      createdAt: '2026-06-12',
      status: 'processing',
      reply: 'Заявка передана техслужбе, ожидайте визит до 21 июня',
    },
    {
      id: 'dorm-t-31',
      topic: 'Замена лампочки в коридоре',
      createdAt: '2026-05-02',
      status: 'closed',
      reply: 'Выполнено 4 мая',
    },
  ],
}

/**
 * @param iso - `YYYY-MM-DD`
 */
export function formatDormDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).format(
    new Date(y, m - 1, d),
  )
}
