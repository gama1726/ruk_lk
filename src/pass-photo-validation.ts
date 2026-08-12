/**
 * @file Проверка фото пропуска до отправки на сервер (формат, вес, разрешение).
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

export const PASS_PHOTO_FORMAT_HINT = 'JPG, JPEG, BMP или PNG'

export const PASS_PHOTO_MAX_BYTES = 2 * 1024 * 1024

export const PASS_PHOTO_MIN_WIDTH = 400

export const PASS_PHOTO_MIN_HEIGHT = 500

const PASS_PHOTO_EXTENSIONS = ['.jpg', '.jpeg', '.bmp', '.png'] as const

const PASS_PHOTO_MIME_PREFIXES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/bmp',
  'image/x-ms-bmp',
] as const

export function isSupportedPassPhotoFormat(file: File): boolean {
  const name = file.name.toLowerCase()
  if (PASS_PHOTO_EXTENSIONS.some((ext) => name.endsWith(ext))) {
    return true
  }
  const type = file.type.toLowerCase()
  if (!type) return false
  return PASS_PHOTO_MIME_PREFIXES.some((prefix) => type === prefix || type.startsWith(prefix))
}

function loadImageSize(file: File): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(null)
    }
    img.src = url
  })
}

/**
 * Формат, вес файла и минимальное разрешение — до запроса на сервер.
 */
export async function validatePassPhotoClient(file: File): Promise<ClientValidationResult> {
  const issues: ClientValidationIssue[] = []

  if (!isSupportedPassPhotoFormat(file)) {
    issues.push({
      code: 'INVALID_FORMAT',
      severity: 'FAIL',
      message: `Используйте формат ${PASS_PHOTO_FORMAT_HINT}.`,
    })
    return { ok: false, issues }
  }

  if (file.size > PASS_PHOTO_MAX_BYTES) {
    issues.push({
      code: 'FILE_TOO_LARGE',
      severity: 'FAIL',
      message: 'Файл больше 2 МБ.',
    })
    return { ok: false, issues }
  }

  const dimensions = await loadImageSize(file)
  if (!dimensions) {
    issues.push({
      code: 'INVALID_FORMAT',
      severity: 'FAIL',
      message: 'Не удалось прочитать изображение.',
    })
    return { ok: false, issues }
  }

  if (
    dimensions.width < PASS_PHOTO_MIN_WIDTH ||
    dimensions.height < PASS_PHOTO_MIN_HEIGHT
  ) {
    issues.push({
      code: 'IMAGE_TOO_SMALL',
      severity: 'FAIL',
      message: `Слишком маленькое фото. Минимальный размер — ${PASS_PHOTO_MIN_WIDTH}×${PASS_PHOTO_MIN_HEIGHT} пикселей.`,
    })
    return { ok: false, issues }
  }

  return { ok: true, issues }
}
