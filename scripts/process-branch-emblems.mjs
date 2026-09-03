/**
 * Вырезает гербы с белого/светлого фона → PNG с прозрачностью.
 * Запуск: node scripts/process-branch-emblems.mjs
 */

import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const branchesDir = fileURLToPath(new URL('../public/branches/', import.meta.url))

function backgroundAlpha(r, g, b) {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const saturation = max === 0 ? 0 : (max - min) / max
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b

  // Почти белый фон JPG
  if (luminance >= 248 && saturation <= 0.06) return 0
  if (luminance >= 238 && saturation <= 0.1) {
    const fade = (luminance - 238) / 10
    return Math.round(255 * (1 - fade))
  }

  // Светло-серый/кремовый ореол вокруг герба
  if (luminance >= 228 && saturation <= 0.08) {
    const fade = (luminance - 228) / 18
    return Math.round(255 * (1 - Math.min(1, fade * 0.85)))
  }

  return 255
}

async function processEmblem(inputPath, outputPath) {
  const { data, info } = await sharp(inputPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true })

  for (let i = 0; i < data.length; i += 4) {
    const alpha = backgroundAlpha(data[i], data[i + 1], data[i + 2])
    data[i + 3] = Math.min(data[i + 3], alpha)
  }

  await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png({ compressionLevel: 9 })
    .toFile(outputPath)

  console.log(`✓ ${outputPath}`)
}

const files = readdirSync(branchesDir).filter((name) => /\.(jpe?g|webp)$/i.test(name))

for (const file of files) {
  const base = file.replace(/\.(jpe?g|webp)$/i, '')
  await processEmblem(join(branchesDir, file), join(branchesDir, `${base}.png`))
}

console.log(`Processed ${files.length} emblem(s).`)
