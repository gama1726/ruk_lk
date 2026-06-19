/**
 * @file Психологическая поддержка (мок).
 * @remarks Без медицинских и интимных деталей — только общие формулировки.
 */

import { create } from 'zustand'

export type ConsultationStatus = 'scheduled' | 'completed' | 'cancelled'

export type Consultation = {
  id: string
  date: string
  time: string
  topic: string
  status: ConsultationStatus
}

export const consultationStatusLabel: Record<ConsultationStatus, string> = {
  scheduled: 'запланировано',
  completed: 'состоялась',
  cancelled: 'отменено',
}

export const consultationTopics = [
  { value: 'stress', label: 'Стресс и нагрузка в учёбе' },
  { value: 'adaptation', label: 'Адаптация в университете' },
  { value: 'relations', label: 'Отношения в группе' },
  { value: 'career', label: 'Выбор направления и карьеры' },
  { value: 'other', label: 'Другое (кратко опишите)' },
] as const

export const availableSlots = [
  { value: '2026-06-24-10', label: '24 июня, 10:00' },
  { value: '2026-06-24-14', label: '24 июня, 14:00' },
  { value: '2026-06-25-11', label: '25 июня, 11:00' },
  { value: '2026-06-26-15', label: '26 июня, 15:00' },
] as const

const seed: Consultation[] = [
  {
    id: 'psy-18',
    date: '2026-05-15',
    time: '14:00',
    topic: 'Подготовка к сессии',
    status: 'completed',
  },
  {
    id: 'psy-22',
    date: '2026-06-24',
    time: '10:00',
    topic: 'Баланс учёбы и личной жизни',
    status: 'scheduled',
  },
]

type NewBooking = {
  slot: string
  topic: string
  note: string
}

type PsychologistStore = {
  consultations: Consultation[]
  /** @param data - слот, тема и краткий комментарий */
  book: (data: NewBooking) => string
}

/**
 * Записи на консультации в памяти сессии.
 */
export const usePsychologist = create<PsychologistStore>((set) => ({
  consultations: [...seed],

  book(data) {
    const match = data.slot.match(/^(\d{4}-\d{2}-\d{2})-(\d{2})$/)
    const date = match?.[1] ?? '2026-06-24'
    const time = match ? `${match[2]}:00` : '10:00'

    const id = `psy-${Date.now()}`
    const item: Consultation = {
      id,
      date,
      time,
      topic: data.topic,
      status: 'scheduled',
    }
    set((s) => ({ consultations: [item, ...s.consultations] }))
    return id
  },
}))

export const psychologistInfo = {
  title: 'Психологический центр РУК',
  hours: 'Пн–Пт, 9:00–17:00',
  location: 'Корпус 1, каб. 204',
  phone: '+7 (495) ***-**-12',
  note: 'Консультации конфиденциальны. Специалист не передаёт содержание беседы третьим лицам без вашего согласия.',
}

/**
 * @param iso - `YYYY-MM-DD`
 */
export function formatConsultDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' }).format(new Date(y, m - 1, d))
}
