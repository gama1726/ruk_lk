/**
 * @file Пауза повторной отправки кода после 503/429.
 */

import { ApiError } from '@/apiClient'

const DEFAULT_COOLDOWN_SEC = 10

/** Секунды блокировки кнопки после ошибки отправки кода. 0 = не блокировать. */
export function sendCodeCooldownSec(error: { message?: string; status?: number } | string | unknown): number {
  if (error instanceof ApiError) {
    return fromStatusAndMessage(error.status, error.message)
  }
  if (typeof error === 'string') {
    return fromStatusAndMessage(0, error)
  }
  if (error && typeof error === 'object' && 'message' in error) {
    const obj = error as { message?: string; status?: number }
    return fromStatusAndMessage(obj.status ?? 0, obj.message ?? '')
  }
  return 0
}

function fromStatusAndMessage(status: number, message: string): number {
  const fromText = message.match(/Подождите\s+(\d+)/i)
  if (fromText) {
    return Math.min(DEFAULT_COOLDOWN_SEC, Math.max(1, Number(fromText[1])))
  }
  if (status === 429 || status === 503 || status >= 500) {
    return DEFAULT_COOLDOWN_SEC
  }
  if (/не удалось отправить код/i.test(message) || /попробуйте позже/i.test(message)) {
    return DEFAULT_COOLDOWN_SEC
  }
  return 0
}

export function remainingCooldownSec(cooldownUntilMs: number | undefined, nowMs = Date.now()): number {
  if (cooldownUntilMs == null) return 0
  return Math.max(0, Math.ceil((cooldownUntilMs - nowMs) / 1000))
}
