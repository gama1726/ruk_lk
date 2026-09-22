/**
 * @file Проверка фото пропуска до отправки на сервер (формат, вес, разрешение).
 * HEIC/HEIF конвертируются в JPEG в браузере перед проверкой и upload.
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

export const PASS_PHOTO_FORMAT_HINT = 'JPG, JPEG, PNG, BMP или HEIC'

/** Лимит одного файла на загрузку (как app.pass-photo.max-size-bytes = 50 МБ). */
export const PASS_PHOTO_MAX_BYTES = 50 * 1024 * 1024

/**
 * Лимит всего multipart-запроса (фото + студенческий + overhead).
 * Должен быть ≤ spring.servlet.multipart.max-request-size.
 */
export const PASS_PHOTO_MAX_REQUEST_BYTES = 105 * 1024 * 1024

export const PASS_PHOTO_MIN_WIDTH = 400

export const PASS_PHOTO_MIN_HEIGHT = 500

export const PASS_PHOTO_ACCEPT =
  'image/jpeg,image/jpg,image/png,image/bmp,image/x-ms-bmp,image/heic,image/heif,.jpg,.jpeg,.bmp,.png,.heic,.heif'

const PASS_PHOTO_EXTENSIONS = ['.jpg', '.jpeg', '.bmp', '.png', '.heic', '.heif'] as const

const PASS_PHOTO_MIME_PREFIXES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/bmp',
  'image/x-ms-bmp',
  'image/heic',
  'image/heif',
] as const

export function formatFileSizeMb(bytes: number): string {
  const mb = bytes / (1024 * 1024)
  if (mb < 0.1) return mb.toFixed(2)
  if (mb >= 10) return mb.toFixed(0)
  return mb.toFixed(1)
}

export function isHeicLikeFile(file: File): boolean {
  const name = file.name.toLowerCase()
  if (name.endsWith('.heic') || name.endsWith('.heif')) return true
  const type = file.type.toLowerCase()
  return type.includes('heic') || type.includes('heif')
}

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
 * HEIC/HEIF → JPEG File; остальные файлы без изменений.
 */
export async function preparePassPhotoFile(file: File): Promise<File> {
  if (!isHeicLikeFile(file)) {
    return file
  }
  try {
    const heic2any = (await import('heic2any')).default
    const converted = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.92,
    })
    const blob = Array.isArray(converted) ? converted[0] : converted
    if (!(blob instanceof Blob)) {
      throw new Error('empty')
    }
    const base = file.name.replace(/\.(heic|heif)$/i, '') || 'photo'
    return new File([blob], `${base}.jpg`, { type: 'image/jpeg', lastModified: Date.now() })
  } catch {
    throw new Error(
      'Не удалось открыть HEIC. Сохраните фото как JPG в «Фото» и выберите снова.',
    )
  }
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
 * Передавайте уже подготовленный файл ({@link preparePassPhotoFile}).
 */
export async function validatePassPhotoClient(file: File): Promise<ClientValidationResult> {
  const issues: ClientValidationIssue[] = []

  if (!isSupportedPassPhotoFormat(file) || isHeicLikeFile(file)) {
    issues.push({
      code: 'INVALID_FORMAT',
      severity: 'FAIL',
      message: isHeicLikeFile(file)
        ? 'Не удалось конвертировать HEIC. Сохраните как JPG и выберите снова.'
        : `Используйте формат ${PASS_PHOTO_FORMAT_HINT}.`,
    })
    return { ok: false, issues }
  }

  if (file.size > PASS_PHOTO_MAX_BYTES) {
    issues.push({
      code: 'FILE_TOO_LARGE',
      severity: 'FAIL',
      message: `Фото лица больше ${formatFileSizeMb(PASS_PHOTO_MAX_BYTES)} МБ (сейчас ${formatFileSizeMb(file.size)} МБ).`,
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

export const ID_CARD_MIN_WIDTH = 200
export const ID_CARD_MIN_HEIGHT = 200

/** Фото студенческого билета: формат, вес, мягкий минимум разрешения. */
export async function validateIdCardClient(file: File): Promise<ClientValidationResult> {
  const issues: ClientValidationIssue[] = []

  if (!isSupportedPassPhotoFormat(file) || isHeicLikeFile(file)) {
    issues.push({
      code: 'INVALID_FORMAT',
      severity: 'FAIL',
      message: isHeicLikeFile(file)
        ? 'Не удалось конвертировать HEIC. Сохраните как JPG и выберите снова.'
        : `Используйте формат ${PASS_PHOTO_FORMAT_HINT}.`,
    })
    return { ok: false, issues }
  }

  if (file.size > PASS_PHOTO_MAX_BYTES) {
    issues.push({
      code: 'FILE_TOO_LARGE',
      severity: 'FAIL',
      message: `Фото студенческого билета больше ${formatFileSizeMb(PASS_PHOTO_MAX_BYTES)} МБ (сейчас ${formatFileSizeMb(file.size)} МБ).`,
    })
    return { ok: false, issues }
  }

  const dimensions = await loadImageSize(file)
  if (!dimensions) {
    issues.push({
      code: 'INVALID_FORMAT',
      severity: 'FAIL',
      message: 'Не удалось прочитать фото студенческого билета.',
    })
    return { ok: false, issues }
  }

  if (dimensions.width < ID_CARD_MIN_WIDTH || dimensions.height < ID_CARD_MIN_HEIGHT) {
    issues.push({
      code: 'IMAGE_TOO_SMALL',
      severity: 'FAIL',
      message: `Фото студенческого билета слишком маленькое. Минимум ${ID_CARD_MIN_WIDTH}×${ID_CARD_MIN_HEIGHT} пикселей.`,
    })
    return { ok: false, issues }
  }

  return { ok: true, issues }
}

/** Проверка суммарного размера до POST (два файла). */
export function validatePassPhotoUploadPair(photo: File, idCard: File): ClientValidationResult {
  const total = photo.size + idCard.size
  if (total > PASS_PHOTO_MAX_REQUEST_BYTES) {
    return {
      ok: false,
      issues: [
        {
          code: 'REQUEST_TOO_LARGE',
          severity: 'FAIL',
          message:
            `Суммарный размер фото и студенческого билета ${formatFileSizeMb(total)} МБ ` +
            `(лимит ${formatFileSizeMb(PASS_PHOTO_MAX_REQUEST_BYTES)} МБ).`,
        },
      ],
    }
  }
  return { ok: true, issues: [] }
}
