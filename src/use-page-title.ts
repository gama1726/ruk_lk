import { useEffect } from 'react'
import { educationTrackLabel, type EducationTrack } from '@/pass-photo'

export const DEFAULT_PAGE_TITLE = 'Личный кабинет — РУК'

/** Заголовок вкладки браузера. При размонтировании восстанавливает предыдущий. */
export function usePageTitle(title: string) {
  useEffect(() => {
    const previous = document.title
    document.title = title
    return () => {
      document.title = previous
    }
  }, [title])
}

export function adminPassPhotoPageTitle(track: EducationTrack | undefined, section: string): string {
  if (!track) {
    return `${section} — Фото для пропуска — РУК`
  }
  return `${section} — Фото для пропуска (${educationTrackLabel[track]}) — РУК`
}
