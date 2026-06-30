/**
 * @file Быстрая клиентская проверка (формат и размер) до запроса на сервер.
 */

export type ValidationSeverity = 'FAIL' | 'WARN'

export type ClientValidationIssue = {
  code: string
  severity: ValidationSeverity
  message: string
}

export type ClientValidationResult = {
  ok: boolean
  issues: ClientValidationIssue[]
}

const PASS_PHOTO_FORMAT_HINT = 'JPG, JPEG, BMP или PNG'

const PASS_PHOTO_EXTENSIONS = ['.jpg', '.jpeg', '.bmp', '.png'] as const

const PASS_PHOTO_MIME_PREFIXES = ['image/jpeg', 'image/jpg', 'image/png', 'image/bmp', 'image/x-ms-bmp'] as const

export function isSupportedPassPhotoFormat(file: File): boolean {
  const name = file.name.toLowerCase()
  if (PASS_PHOTO_EXTENSIONS.some((ext) => name.endsWith(ext))) {
    return true
  }
  const type = file.type.toLowerCase()
  if (!type) return false
  return PASS_PHOTO_MIME_PREFIXES.some((prefix) => type === prefix || type.startsWith(prefix))
}

/**
 * Формат и размер — без проверки лица и фона (это делает сервер).
 */
export function validatePassPhotoClientBasic(file: File): ClientValidationResult {
  const issues: ClientValidationIssue[] = []

  if (!isSupportedPassPhotoFormat(file)) {
    issues.push({
      code: 'INVALID_FORMAT',
      severity: 'FAIL',
      message: `Используйте формат ${PASS_PHOTO_FORMAT_HINT}.`,
    })
    return { ok: false, issues }
  }

  if (file.size > 2 * 1024 * 1024) {
    issues.push({
      code: 'FILE_TOO_LARGE',
      severity: 'FAIL',
      message: 'Файл больше 2 МБ.',
    })
    return { ok: false, issues }
  }

  return { ok: true, issues }
}
