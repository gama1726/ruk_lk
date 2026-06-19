/**
 * @file Типы заявлений и справок.
 */

export type RequestStatus = 'draft' | 'sent' | 'processing' | 'ready' | 'rejected' | 'archived'

export const requestStatusLabel: Record<RequestStatus, string> = {
  draft: 'черновик',
  sent: 'отправлено',
  processing: 'в обработке',
  ready: 'готово',
  rejected: 'отказано',
  archived: 'архив',
}

export type RequestTypeId =
  | 'study-place'
  | 'study-period'
  | 'dean'
  | 'transfer'
  | 'restore'
  | 'academic-leave'

export type RequestItem = {
  id: string
  typeId: RequestTypeId
  typeLabel: string
  createdAt: string
  status: RequestStatus
  comment: string
  delivery: string
}

export const requestTypes: { id: RequestTypeId; label: string }[] = [
  { id: 'study-place', label: 'Справка с места учёбы' },
  { id: 'study-period', label: 'Справка о периоде обучения' },
  { id: 'dean', label: 'Заявление в деканат' },
  { id: 'transfer', label: 'Заявление на перевод' },
  { id: 'restore', label: 'Заявление на восстановление' },
  { id: 'academic-leave', label: 'Заявление на академический отпуск' },
]

export const deliveryOptions = [
  { value: 'office', label: 'Лично в деканате' },
  { value: 'mail', label: 'Почтой России' },
  { value: 'email', label: 'Электронная копия' },
] as const
