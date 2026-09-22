/**
 * @file HTTP-клиент для backend API.
 * @remarks
 * - Сейчас backend не подключён: при пустом `VITE_API_BASE_URL` запросы не уходят.
 * - Токены не кладём в `localStorage`; после SSO — httpOnly-cookie и `credentials: 'include'`.
 * @see {@link isApiConfigured}
 * @example
 * import { apiGet } from '@/apiClient'
 * const profile = await apiGet<StudentDto>('/student/profile')
 */

/**
 * Базовый URL API.
 * Dev: из `VITE_API_BASE_URL`. Prod за nginx: текущий origin (IP и домен работают одинаково).
 */
export function getApiBaseUrl(): string {
  const fromEnv = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')
  if (import.meta.env.PROD && typeof window !== 'undefined') {
    return window.location.origin
  }
  return fromEnv
}

/** @deprecated Используйте {@link getApiBaseUrl}; в prod всегда origin страницы */
export const apiBaseUrl = getApiBaseUrl()

/**
 * Проверяет, подключён ли backend.
 * @returns в prod — `true`; в dev — если задан `VITE_API_BASE_URL`
 */
export function isApiConfigured(): boolean {
  if (import.meta.env.PROD) return true
  return getApiBaseUrl().length > 0
}

/** Тело ошибки от API (Spring ProblemDetail или произвольный JSON) */
export type ApiErrorBody = {
  message?: string
  detail?: string
  title?: string
}

/**
 * Ошибка HTTP-запроса с кодом ответа.
 * @remarks Не показываем пользователю stack trace — только `message`.
 */
export class ApiError extends Error {
  readonly status: number
  readonly body?: ApiErrorBody

  /**
   * @param status - HTTP-код
   * @param message - текст для UI
   * @param body - необязательное тело ответа
   */
  constructor(status: number, message: string, body?: ApiErrorBody) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

type RequestOptions = RequestInit & {
  /** JSON-тело для POST/PATCH/PUT */
  json?: unknown
}

/**
 * Собирает полный URL запроса.
 * @param path - путь с ведущим `/`, например `/student/profile`
 * @returns абсолютный URL
 * @throws {@link Error} если API не настроен
 */
function buildUrl(path: string): string {
  if (!isApiConfigured()) {
    throw new Error('API не настроен: укажите VITE_API_BASE_URL в .env')
  }
  return `${getApiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`
}

/**
 * Выполняет запрос к API и разбирает ответ.
 * @param path - путь относительно базового URL
 * @param options - опции fetch и поле `json` для тела
 * @returns распарсенный JSON
 * @throws {@link ApiError} при ответе не 2xx
 * @throws {@link Error} если API не настроен или ответ не JSON
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { json, headers, ...rest } = options

  const response = await fetch(buildUrl(path), {
    credentials: 'include',
    headers: {
      ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
    ...rest,
  })

  const text = await response.text()
  let data: unknown = undefined

  if (text) {
    try {
      data = JSON.parse(text) as unknown
    } catch {
      if (!response.ok) {
        throw new ApiError(response.status, 'Ошибка сервера')
      }
      throw new Error('Ответ API не является JSON')
    }
  }

  if (!response.ok) {
    const body = (typeof data === 'object' && data !== null ? data : undefined) as ApiErrorBody | undefined
    const message = body?.message ?? body?.detail ?? defaultMessage(response.status)
    throw new ApiError(response.status, message, body)
  }

  return data as T
}

/**
 * GET-запрос к API.
 * @param path - путь ресурса
 * @param init - дополнительные опции fetch
 */
export function apiGet<T>(path: string, init?: RequestInit): Promise<T> {
  return apiRequest<T>(path, { ...init, method: 'GET' })
}

/**
 * POST-запрос с JSON-телом.
 * @param path - путь ресурса
 * @param json - тело запроса
 * @param init - дополнительные опции fetch
 */
export function apiPost<T>(path: string, json: unknown, init?: RequestInit): Promise<T> {
  return apiRequest<T>(path, { ...init, method: 'POST', json })
}

/**
 * PUT-запрос с JSON-телом.
 */
export function apiPut<T>(path: string, json: unknown, init?: RequestInit): Promise<T> {
  return apiRequest<T>(path, { ...init, method: 'PUT', json })
}

/**
 * DELETE-запрос.
 */
export function apiDelete<T>(path: string, init?: RequestInit): Promise<T> {
  return apiRequest<T>(path, { ...init, method: 'DELETE' })
}

/**
 * POST multipart/form-data (загрузка файлов).
 */
export async function apiPostFormData<T>(path: string, formData: FormData, init?: RequestInit): Promise<T> {
  const response = await fetch(buildUrl(path), {
    credentials: 'include',
    method: 'POST',
    body: formData,
    ...init,
    headers: {
      ...init?.headers,
    },
  })

  const text = await response.text()
  let data: unknown = undefined
  if (text) {
    try {
      data = JSON.parse(text) as unknown
    } catch {
      if (!response.ok) {
        throw new ApiError(response.status, 'Ошибка сервера')
      }
      throw new Error('Ответ API не является JSON')
    }
  }

  if (!response.ok) {
    const body = (typeof data === 'object' && data !== null ? data : undefined) as ApiErrorBody & {
      issues?: PassPhotoIssuePayload[]
    }
    const message = body?.message ?? body?.detail ?? defaultMessage(response.status)
    const err = new ApiError(response.status, message, body)
    if (response.status === 422 && body?.issues) {
      ;(err as ApiError & { issues?: PassPhotoIssuePayload[] }).issues = body.issues
    }
    throw err
  }

  return data as T
}

export type PassPhotoIssuePayload = {
  code?: string
  severity?: 'FAIL' | 'WARN'
  message: string
}

/**
 * GET бинарного ответа (файл) с разбором имени из Content-Disposition.
 */
export async function apiGetBlob(path: string, init?: RequestInit): Promise<{ blob: Blob; filename: string | null }> {
  const response = await fetch(buildUrl(path), {
    credentials: 'include',
    method: 'GET',
    ...init,
  })
  if (!response.ok) {
    const text = await response.text()
    let message = defaultMessage(response.status)
    if (text) {
      try {
        const body = JSON.parse(text) as ApiErrorBody
        message = body.message ?? body.detail ?? message
      } catch {
        /* ignore */
      }
    }
    throw new ApiError(response.status, message)
  }
  const blob = await response.blob()
  const disposition = response.headers.get('Content-Disposition')
  let filename: string | null = null
  if (disposition) {
    const utf = /filename\*=UTF-8''([^;]+)/i.exec(disposition)
    const plain = /filename="?([^";]+)"?/i.exec(disposition)
    if (utf?.[1]) {
      try {
        filename = decodeURIComponent(utf[1])
      } catch {
        filename = utf[1]
      }
    } else if (plain?.[1]) {
      filename = plain[1]
    }
  }
  return { blob, filename }
}

/**
 * @param status - HTTP-код
 * @returns сообщение по умолчанию для UI
 */
function defaultMessage(status: number): string {
  if (status === 401) return 'Сессия истекла. Войдите снова.'
  if (status === 400) return 'Неверный запрос.'
  if (status === 403) return 'Недостаточно прав для этого действия.'
  if (status === 404) return 'Запрошенные данные не найдены.'
  if (status === 413) {
    return 'Файл слишком большой. Одно фото — до 50 МБ, фото и студенческий билет вместе — до 105 МБ.'
  }
  if (status === 422) return 'Проверьте данные и исправьте ошибки.'
  if (status === 429) return 'Слишком частые запросы. Попробуйте позже.'
  if (status >= 500) return 'Сервер временно недоступен. Попробуйте позже.'
  return 'Не удалось выполнить запрос.'
}
