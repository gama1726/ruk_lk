export type PassPhotoRejectReason = {
  id: string
  label: string
  text: string
}

/** Готовые формулировки для отклонения заявки на фото пропуска. */
export const passPhotoRejectReasons: PassPhotoRejectReason[] = [
  {
    id: 'requirements',
    label: 'Не по требованиям',
    text: 'Фото не соответствует требованиям для пропуска.',
  },
  {
    id: 'background',
    label: 'Фон',
    text: 'Фон не белый или не однотонный. Сделайте снимок у светлой однотонной стены.',
  },
  {
    id: 'face',
    label: 'Лицо',
    text: 'Лицо плохо видно или снято не анфас. В кадре должны быть голова и плечи.',
  },
  {
    id: 'quality',
    label: 'Качество',
    text: 'Фото слишком тёмное, размытое или с посторонними предметами в кадре.',
  },
]
