/**
 * @file Переход в кабинет киберспорта через backend-мост.
 */

import { useEffect, useState } from 'react'
import { ComingSoon } from '@/pages/coming-soon'
import { useDevPreview } from '@/use-dev-preview'
import { ScreenHeader, Loader } from '@/ui'
import { getApiBaseUrl, isApiConfigured } from '@/apiClient'

function EsportsRedirectContent() {
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isApiConfigured()) {
      setError('API личного кабинета не подключено.')
      return
    }
    window.location.assign(`${getApiBaseUrl()}/api/student/esports/redirect`)
  }, [])

  return (
    <>
      <ScreenHeader
        title="Киберспорт"
        subtitle="Открываем кабинет капитана на сайте киберспорта РУК"
      />
      <p>{error ?? 'Переходим…'}</p>
    </>
  )
}

export function EsportsRedirect() {
  const preview = useDevPreview()
  if (preview === null) return <Loader />
  if (!preview) return <ComingSoon title="Киберспорт" />
  return <EsportsRedirectContent />
}
