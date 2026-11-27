import type { EmployeeBirthdayItem } from '@/http/employees'

export type BirthdayCardFormat = 'square' | 'story'
export type BirthdayCardTheme = 'masterclin' | 'festive'

export const MONTH_NAMES_PT = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
] as const

export const BIRTHDAY_MESSAGE_PRESETS = [
  {
    id: 'institutional',
    label: 'Institucional',
    text: 'Desejamos um novo ciclo repleto de saúde, conquistas e alegrias. Obrigado por fazer parte da nossa equipe!',
  },
  {
    id: 'warm',
    label: 'Acolhedor',
    text: 'Que o seu dia seja tão especial quanto a dedicação que você traz todos os dias para a família Masterclin!',
  },
  {
    id: 'short',
    label: 'Curto',
    text: 'Parabéns pelo seu dia! Muita saúde, sucesso e realizações neste novo ano de vida.',
  },
] as const

export interface IndividualCardOptions {
  displayName: string
  roleTitle: string
  unitName: string | null
  departmentName: string | null
  birthDay: number
  birthMonth: number
  photoSrc: string
  photoZoom: number // 1.0 to 1.8
  photoOffsetY: number // -40 to 40 (%)
  showRole: boolean
  showUnit: boolean
  message: string
  format: BirthdayCardFormat
  theme: BirthdayCardTheme
}

export interface CollectiveCardOptions {
  month: number
  employees: EmployeeBirthdayItem[]
  filterLabel: string | null
  subtitle: string
  format: BirthdayCardFormat
  theme: BirthdayCardTheme
}

interface ThemePalette {
  bgTop: string
  bgBottom: string
  cardBg: string
  cardBorder: string
  accentPrimary: string
  accentSecondary: string
  accentSoftBg: string
  accentSoftBorder: string
  titleColor: string
  textPrimary: string
  textSecondary: string
  confettiColors: string[]
  footerBg: string
  footerText: string
}

const PALETTES: Record<BirthdayCardTheme, ThemePalette> = {
  masterclin: {
    bgTop: '#edf4fc',
    bgBottom: '#dce9f9',
    cardBg: '#ffffff',
    cardBorder: '#b9d4f2',
    accentPrimary: '#0056b3',
    accentSecondary: '#f59e0b',
    accentSoftBg: '#e6f0fa',
    accentSoftBorder: '#b3d4f5',
    titleColor: '#004494',
    textPrimary: '#0f172a',
    textSecondary: '#475569',
    confettiColors: ['#0056b3', '#3b82f6', '#f59e0b', '#38bdf8', '#93c5fd'],
    footerBg: '#0056b3',
    footerText: '#ffffff',
  },
  festive: {
    bgTop: '#fff9eb',
    bgBottom: '#fef0d1',
    cardBg: '#ffffff',
    cardBorder: '#f3d28b',
    accentPrimary: '#b45309',
    accentSecondary: '#0056b3',
    accentSoftBg: '#fef3c7',
    accentSoftBorder: '#fcd34d',
    titleColor: '#92400e',
    textPrimary: '#1e293b',
    textSecondary: '#57534e',
    confettiColors: ['#f59e0b', '#d97706', '#0056b3', '#fbbf24', '#f97316'],
    footerBg: '#1e3a5f',
    footerText: '#fef3c7',
  },
}

const imageCache = new Map<string, Promise<HTMLImageElement | null>>()

function loadImage(src: string): Promise<HTMLImageElement | null> {
  if (!src) return Promise.resolve(null)

  // Only cache static asset paths, never user object/data URLs that change frequently
  const isStaticAsset = src.startsWith('/')
  if (isStaticAsset && imageCache.has(src)) {
    return imageCache.get(src)!
  }

  const promise = new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image()
    if (!src.startsWith('data:') && !src.startsWith('blob:')) {
      img.crossOrigin = 'anonymous'
    }
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })

  if (isStaticAsset) {
    imageCache.set(src, promise)
  }

  return promise
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}

function getVisibleBounds(img: HTMLImageElement) {
  const w = img.naturalWidth || img.width
  const h = img.naturalHeight || img.height
  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = w
  tempCanvas.height = h
  const tCtx = tempCanvas.getContext('2d', { willReadFrequently: true })
  if (!tCtx) {
    return { sx: 0, sy: 0, sw: w, sh: h }
  }
  tCtx.drawImage(img, 0, 0)
  try {
    const { data } = tCtx.getImageData(0, 0, w, h)
    let minX = w
    let minY = h
    let maxX = 0
    let maxY = 0
    let hasPixels = false

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const alpha = data[(y * w + x) * 4 + 3]
        if (alpha > 15) {
          hasPixels = true
          if (x < minX) minX = x
          if (x > maxX) maxX = x
          if (y < minY) minY = y
          if (y > maxY) maxY = y
        }
      }
    }

    if (hasPixels && maxX >= minX && maxY >= minY) {
      return {
        sx: minX,
        sy: minY,
        sw: maxX - minX + 1,
        sh: maxY - minY + 1,
      }
    }
  } catch {
    // Fallback if canvas read fails
  }

  return { sx: 0, sy: 0, sw: w, sh: h }
}

function drawDecorations(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  palette: ThemePalette
) {
  // Subtle radial glow behind card
  const grad = ctx.createLinearGradient(0, 0, 0, height)
  grad.addColorStop(0, palette.bgTop)
  grad.addColorStop(1, palette.bgBottom)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, width, height)

  // Soft decorative halos in corners
  ctx.save()
  ctx.globalAlpha = 0.14
  ctx.fillStyle = palette.accentPrimary
  ctx.beginPath()
  ctx.arc(90, 90, 210, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = palette.accentSecondary
  ctx.beginPath()
  ctx.arc(width - 80, height - 110, 240, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  // Tasteful geometric confetti pieces near the outer frame
  const confetti = [
    { x: 0.08, y: 0.12, r: 9, kind: 'dot', colorIdx: 0 },
    { x: 0.15, y: 0.07, r: 14, kind: 'pill', rot: 0.5, colorIdx: 2 },
    { x: 0.89, y: 0.09, r: 11, kind: 'dot', colorIdx: 2 },
    { x: 0.93, y: 0.16, r: 16, kind: 'pill', rot: -0.6, colorIdx: 1 },
    { x: 0.06, y: 0.48, r: 13, kind: 'pill', rot: 0.9, colorIdx: 3 },
    { x: 0.94, y: 0.44, r: 8, kind: 'dot', colorIdx: 0 },
    { x: 0.09, y: 0.84, r: 10, kind: 'dot', colorIdx: 2 },
    { x: 0.91, y: 0.82, r: 15, kind: 'pill', rot: 0.4, colorIdx: 4 },
    { x: 0.2, y: 0.92, r: 12, kind: 'pill', rot: -0.3, colorIdx: 0 },
    { x: 0.82, y: 0.93, r: 9, kind: 'dot', colorIdx: 2 },
  ]

  ctx.save()
  ctx.globalAlpha = 0.55
  for (const piece of confetti) {
    ctx.fillStyle =
      palette.confettiColors[piece.colorIdx % palette.confettiColors.length]
    const px = width * piece.x
    const py = height * piece.y
    if (piece.kind === 'dot') {
      ctx.beginPath()
      ctx.arc(px, py, piece.r, 0, Math.PI * 2)
      ctx.fill()
    } else {
      ctx.save()
      ctx.translate(px, py)
      ctx.rotate(piece.rot ?? 0)
      roundRect(ctx, -piece.r, -piece.r * 0.35, piece.r * 2, piece.r * 0.7, 5)
      ctx.fill()
      ctx.restore()
    }
  }
  ctx.restore()
}

function drawLogoCentered(
  ctx: CanvasRenderingContext2D,
  logo: HTMLImageElement | null,
  centerX: number,
  topY: number,
  maxW: number,
  maxH: number
): number {
  if (!logo || !logo.complete || logo.naturalHeight === 0) {
    return topY
  }
  const { sx, sy, sw, sh } = getVisibleBounds(logo)
  let logoW = maxW
  let logoH = (sh / sw) * logoW
  if (logoH > maxH) {
    logoH = maxH
    logoW = (sw / sh) * logoH
  }
  ctx.drawImage(logo, sx, sy, sw, sh, centerX - logoW / 2, topY, logoW, logoH)
  return topY + logoH
}

function wrapTextLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return []

  const lines: string[] = []
  let current = words[0]

  for (let i = 1; i < words.length; i++) {
    const candidate = `${current} ${words[i]}`
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate
    } else {
      lines.push(current)
      current = words[i]
      if (lines.length === maxLines - 1) {
        // Append remaining words and ellipsize if needed
        let rest = words.slice(i).join(' ')
        while (
          rest.length > 3 &&
          ctx.measureText(`${rest}…`).width > maxWidth
        ) {
          rest = rest.slice(0, -1).trimEnd()
        }
        lines.push(
          ctx.measureText(words.slice(i).join(' ')).width <= maxWidth
            ? words.slice(i).join(' ')
            : `${rest}…`
        )
        return lines
      }
    }
  }

  lines.push(current)
  return lines
}

function drawCircularCoverPhoto(
  ctx: CanvasRenderingContext2D,
  photo: HTMLImageElement,
  cx: number,
  cy: number,
  radius: number,
  zoom: number,
  offsetYPercent: number,
  palette: ThemePalette
) {
  // Outer soft shadow & golden/accent ring
  ctx.save()
  ctx.shadowColor = 'rgba(15, 23, 42, 0.16)'
  ctx.shadowBlur = 32
  ctx.shadowOffsetY = 12
  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.arc(cx, cy, radius + 14, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  // Accent outer stroke ring
  ctx.save()
  ctx.strokeStyle = palette.accentSecondary
  ctx.lineWidth = 6
  ctx.beginPath()
  ctx.arc(cx, cy, radius + 14, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()

  // Clipped circular photo with cover framing + zoom + vertical framing
  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.closePath()
  ctx.clip()

  const diameter = radius * 2
  const natW = photo.naturalWidth || photo.width
  const natH = photo.naturalHeight || photo.height

  const baseScale = Math.max(diameter / natW, diameter / natH)
  const scale = baseScale * Math.max(1, Math.min(2, zoom))
  const drawW = natW * scale
  const drawH = natH * scale

  const clampedOffsetPct = Math.max(-100, Math.min(100, offsetYPercent))
  const maxShiftY = Math.max(0, (drawH - diameter) / 2)
  const verticalShift = (clampedOffsetPct / 100) * maxShiftY

  const drawX = cx - drawW / 2
  const drawY = cy - drawH / 2 + verticalShift

  ctx.drawImage(photo, drawX, drawY, drawW, drawH)
  ctx.restore()

  // Inner crisp white border
  ctx.save()
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 5
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()
}

export async function renderIndividualBirthdayCard(
  canvas: HTMLCanvasElement,
  options: IndividualCardOptions,
  signal?: { isCancelled: () => boolean }
): Promise<void> {
  const isStory = options.format === 'story'
  const width = 1080
  const height = isStory ? 1920 : 1080

  const palette = PALETTES[options.theme]
  const [logo, photo] = await Promise.all([
    loadImage('/images/masterclin-logo.png'),
    loadImage(options.photoSrc),
  ])

  if (signal?.isCancelled()) return

  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  drawDecorations(ctx, width, height, palette)

  // Main elevated card container
  const marginX = 64
  const marginTop = isStory ? 110 : 54
  const marginBottom = isStory ? 110 : 54
  const cardX = marginX
  const cardY = marginTop
  const cardW = width - marginX * 2
  const cardH = height - marginTop - marginBottom

  ctx.save()
  ctx.shadowColor = 'rgba(15, 23, 42, 0.10)'
  ctx.shadowBlur = 40
  ctx.shadowOffsetY = 16
  ctx.fillStyle = palette.cardBg
  roundRect(ctx, cardX, cardY, cardW, cardH, 36)
  ctx.fill()
  ctx.restore()

  ctx.strokeStyle = palette.cardBorder
  ctx.lineWidth = 3
  roundRect(ctx, cardX, cardY, cardW, cardH, 36)
  ctx.stroke()

  // Top accent ribbon inside card
  ctx.save()
  roundRect(ctx, cardX, cardY, cardW, cardH, 36)
  ctx.clip()
  const topBarGrad = ctx.createLinearGradient(
    cardX,
    cardY,
    cardX + cardW,
    cardY
  )
  topBarGrad.addColorStop(0, palette.accentPrimary)
  topBarGrad.addColorStop(1, palette.accentSecondary)
  ctx.fillStyle = topBarGrad
  ctx.fillRect(cardX, cardY, cardW, 16)
  ctx.restore()

  const centerX = width / 2

  // 1. Masterclin Logo
  const logoBottom = drawLogoCentered(
    ctx,
    logo,
    centerX,
    cardY + (isStory ? 62 : 42),
    isStory ? 410 : 330,
    isStory ? 105 : 82
  )

  // 2. Title "FELIZ ANIVERSÁRIO!"
  const titleY = logoBottom + (isStory ? 84 : 58)
  ctx.textAlign = 'center'
  ctx.fillStyle = palette.titleColor
  ctx.font = `800 ${isStory ? 56 : 44}px "Inter", system-ui, -apple-system, sans-serif`
  ctx.fillText('FELIZ ANIVERSÁRIO!', centerX, titleY)

  // 3. Date Pill (DD de Mês — NEVER age/birth year)
  const monthName = MONTH_NAMES_PT[options.birthMonth - 1] ?? ''
  const dateText = `${String(options.birthDay).padStart(2, '0')} DE ${monthName.toUpperCase()}`
  ctx.font = `700 ${isStory ? 24 : 20}px "Inter", system-ui, -apple-system, sans-serif`
  const pillPadX = 32
  const pillW = ctx.measureText(dateText).width + pillPadX * 2
  const pillH = isStory ? 52 : 44
  const pillY = titleY + (isStory ? 28 : 18)

  ctx.fillStyle = palette.accentSoftBg
  roundRect(ctx, centerX - pillW / 2, pillY, pillW, pillH, pillH / 2)
  ctx.fill()
  ctx.strokeStyle = palette.accentSoftBorder
  ctx.lineWidth = 2
  ctx.stroke()

  ctx.fillStyle = palette.accentPrimary
  ctx.fillText(dateText, centerX, pillY + (isStory ? 34 : 29))

  // 4. Circular Photo Frame
  const photoRadius = isStory ? 235 : 162
  const photoCenterY = pillY + pillH + (isStory ? 295 : 196)

  if (photo?.complete && photo.naturalHeight > 0) {
    drawCircularCoverPhoto(
      ctx,
      photo,
      centerX,
      photoCenterY,
      photoRadius,
      options.photoZoom,
      options.photoOffsetY,
      palette
    )
  }

  // 5. Employee Name
  const nameStartY = photoCenterY + photoRadius + (isStory ? 96 : 64)
  const displayName = options.displayName.trim() || 'Colaborador'
  const nameFontSize =
    displayName.length > 26 ? (isStory ? 44 : 34) : isStory ? 52 : 40
  ctx.fillStyle = palette.textPrimary
  ctx.font = `800 ${nameFontSize}px "Inter", system-ui, -apple-system, sans-serif`
  const nameLines = wrapTextLines(ctx, displayName, cardW - 110, 2)
  const nameLineH = nameFontSize * 1.18
  nameLines.forEach((line, idx) => {
    ctx.fillText(line, centerX, nameStartY + idx * nameLineH)
  })

  let cursorY = nameStartY + (nameLines.length - 1) * nameLineH

  // 6. Optional Role & Unit/Department Subtitle
  const metaParts: string[] = []
  if (options.showRole && options.roleTitle.trim()) {
    metaParts.push(options.roleTitle.trim())
  }
  if (options.showUnit) {
    const locationParts = [options.departmentName, options.unitName].filter(
      Boolean
    )
    if (locationParts.length > 0) {
      metaParts.push(locationParts.join(' • '))
    }
  }

  if (metaParts.length > 0) {
    cursorY += isStory ? 44 : 34
    ctx.fillStyle = palette.accentPrimary
    ctx.font = `600 ${isStory ? 26 : 21}px "Inter", system-ui, -apple-system, sans-serif`
    const metaLines = wrapTextLines(
      ctx,
      metaParts.join('  |  '),
      cardW - 120,
      2
    )
    metaLines.forEach((line, idx) => {
      ctx.fillText(line, centerX, cursorY + idx * (isStory ? 34 : 26))
    })
    cursorY += (metaLines.length - 1) * (isStory ? 34 : 26)
  }

  // Subtle decorative divider
  cursorY += isStory ? 46 : 26
  ctx.fillStyle = palette.accentSecondary
  roundRect(ctx, centerX - 60, cursorY, 120, 5, 3)
  ctx.fill()

  // 7. Celebration Message
  const footerHeight = isStory ? 96 : 74
  const footerY = cardY + cardH - footerHeight
  const messageText = options.message.trim()
  if (messageText) {
    const msgFontSize = isStory ? 30 : 22
    const msgLineH = isStory ? 44 : 32
    ctx.fillStyle = palette.textSecondary
    ctx.font = `500 ${msgFontSize}px "Inter", system-ui, -apple-system, sans-serif`
    const msgLines = wrapTextLines(
      ctx,
      messageText,
      cardW - 140,
      isStory ? 5 : 3
    )
    const msgStartY = Math.min(
      cursorY + (isStory ? 68 : 42),
      footerY - msgLines.length * msgLineH - 22
    )
    msgLines.forEach((line, idx) => {
      ctx.fillText(line, centerX, msgStartY + idx * msgLineH)
    })
  }

  // 8. Footer Strip inside card
  ctx.save()
  roundRect(ctx, cardX, cardY, cardW, cardH, 36)
  ctx.clip()
  ctx.fillStyle = palette.footerBg
  ctx.fillRect(cardX, footerY, cardW, footerHeight)
  ctx.fillStyle = palette.footerText
  ctx.font = `700 ${isStory ? 22 : 18}px "Inter", system-ui, -apple-system, sans-serif`
  ctx.textAlign = 'center'
  ctx.fillText(
    'COM CARINHO, EQUIPE MASTERCLIN',
    centerX,
    footerY + footerHeight / 2 + (isStory ? 8 : 6)
  )
  ctx.restore()
}

export async function renderCollectiveBirthdayCard(
  canvas: HTMLCanvasElement,
  options: CollectiveCardOptions,
  signal?: { isCancelled: () => boolean }
): Promise<void> {
  const isStory = options.format === 'story'
  const width = 1080
  const height = isStory ? 1920 : 1080

  const palette = PALETTES[options.theme]
  const logo = await loadImage('/images/masterclin-logo.png')

  if (signal?.isCancelled()) return

  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  drawDecorations(ctx, width, height, palette)

  const marginX = 56
  const marginTop = isStory ? 96 : 48
  const marginBottom = isStory ? 96 : 48
  const cardX = marginX
  const cardY = marginTop
  const cardW = width - marginX * 2
  const cardH = height - marginTop - marginBottom

  ctx.save()
  ctx.shadowColor = 'rgba(15, 23, 42, 0.10)'
  ctx.shadowBlur = 40
  ctx.shadowOffsetY = 16
  ctx.fillStyle = palette.cardBg
  roundRect(ctx, cardX, cardY, cardW, cardH, 34)
  ctx.fill()
  ctx.restore()

  ctx.strokeStyle = palette.cardBorder
  ctx.lineWidth = 3
  roundRect(ctx, cardX, cardY, cardW, cardH, 34)
  ctx.stroke()

  // Top gradient ribbon
  ctx.save()
  roundRect(ctx, cardX, cardY, cardW, cardH, 34)
  ctx.clip()
  const topBarGrad = ctx.createLinearGradient(
    cardX,
    cardY,
    cardX + cardW,
    cardY
  )
  topBarGrad.addColorStop(0, palette.accentPrimary)
  topBarGrad.addColorStop(1, palette.accentSecondary)
  ctx.fillStyle = topBarGrad
  ctx.fillRect(cardX, cardY, cardW, 14)
  ctx.restore()

  const centerX = width / 2
  const logoBottom = drawLogoCentered(
    ctx,
    logo,
    centerX,
    cardY + (isStory ? 54 : 36),
    isStory ? 380 : 300,
    isStory ? 96 : 74
  )

  const monthName = (MONTH_NAMES_PT[options.month - 1] ?? '').toUpperCase()

  ctx.textAlign = 'center'
  ctx.fillStyle = palette.titleColor
  ctx.font = `800 ${isStory ? 48 : 38}px "Inter", system-ui, -apple-system, sans-serif`
  const titleY = logoBottom + (isStory ? 72 : 52)
  ctx.fillText(`ANIVERSARIANTES DE ${monthName}`, centerX, titleY)

  // Subtitle / Unit Filter Pill
  const badgeText = options.filterLabel
    ? options.filterLabel.toUpperCase()
    : 'EQUIPE MASTERCLIN • CELEBRANDO VIDAS'
  ctx.font = `700 ${isStory ? 20 : 16}px "Inter", system-ui, -apple-system, sans-serif`
  const pillW = ctx.measureText(badgeText).width + 48
  const pillH = isStory ? 44 : 36
  const pillY = titleY + (isStory ? 22 : 16)

  ctx.fillStyle = palette.accentSoftBg
  roundRect(ctx, centerX - pillW / 2, pillY, pillW, pillH, pillH / 2)
  ctx.fill()
  ctx.strokeStyle = palette.accentSoftBorder
  ctx.lineWidth = 1.5
  ctx.stroke()

  ctx.fillStyle = palette.accentPrimary
  ctx.fillText(badgeText, centerX, pillY + (isStory ? 29 : 24))

  // Editorial List Area (Option A — No individual photos)
  const footerHeight = isStory ? 116 : 82
  const footerY = cardY + cardH - footerHeight
  const listTopY = pillY + pillH + (isStory ? 44 : 28)
  const listBottomY = footerY - (isStory ? 36 : 24)
  const availableH = Math.max(120, listBottomY - listTopY)

  const items = options.employees
  const listPaddingX = 48
  const listW = cardW - listPaddingX * 2
  const listX = cardX + listPaddingX

  if (items.length === 0) {
    ctx.fillStyle = palette.textSecondary
    ctx.font = '600 24px "Inter", system-ui, -apple-system, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(
      'Nenhum aniversariante neste mês.',
      centerX,
      listTopY + availableH / 2
    )
  } else {
    const singleColLimit = isStory ? 12 : 7
    const columns = items.length > singleColLimit ? 2 : 1
    const colGap = 24
    const colW = columns === 2 ? (listW - colGap) / 2 : listW
    const rowsPerCol = Math.ceil(items.length / columns)
    const rowGap = rowsPerCol > 12 ? 8 : 12
    const rawRowH = (availableH - (rowsPerCol - 1) * rowGap) / rowsPerCol
    const rowH = Math.max(40, Math.min(isStory ? 88 : 74, rawRowH))

    const totalGridH = rowsPerCol * rowH + (rowsPerCol - 1) * rowGap
    const startY = listTopY + Math.max(0, (availableH - totalGridH) / 2)

    const compact = rowH < 54
    const nameSize = compact
      ? columns === 2
        ? 17
        : 20
      : columns === 2
        ? 20
        : 24
    const metaSize = compact ? 13 : columns === 2 ? 14 : 16
    const badgeW = compact ? 64 : 78
    const badgeH = Math.min(rowH - 12, compact ? 30 : 40)

    items.forEach((emp, index) => {
      const col = columns === 2 ? Math.floor(index / rowsPerCol) : 0
      const row = columns === 2 ? index % rowsPerCol : index

      const rx = listX + col * (colW + colGap)
      const ry = startY + row * (rowH + rowGap)

      // Row card background
      ctx.fillStyle = row % 2 === 0 ? '#f8fafc' : '#ffffff'
      roundRect(ctx, rx, ry, colW, rowH, 14)
      ctx.fill()
      ctx.strokeStyle = palette.accentSoftBorder
      ctx.lineWidth = 1.5
      ctx.stroke()

      // Day/Month pill on the left
      const bx = rx + 14
      const by = ry + (rowH - badgeH) / 2
      ctx.fillStyle = palette.accentPrimary
      roundRect(ctx, bx, by, badgeW, badgeH, 10)
      ctx.fill()

      const dayStr = `${String(emp.birthDay).padStart(2, '0')}/${String(emp.birthMonth).padStart(2, '0')}`
      ctx.fillStyle = '#ffffff'
      ctx.textAlign = 'center'
      ctx.font = `800 ${compact ? 15 : 18}px "Inter", system-ui, -apple-system, sans-serif`
      ctx.fillText(dayStr, bx + badgeW / 2, by + badgeH / 2 + (compact ? 5 : 6))

      // Name + Unit/Department on the right
      const textX = bx + badgeW + 16
      const maxTextW = rx + colW - textX - 14
      const unitOrDept = [emp.unit?.name, emp.department?.name]
        .filter(Boolean)
        .join(' • ')

      ctx.textAlign = 'left'
      ctx.fillStyle = palette.textPrimary
      ctx.font = `700 ${nameSize}px "Inter", system-ui, -apple-system, sans-serif`

      let nameToDraw = emp.fullName
      while (
        nameToDraw.length > 4 &&
        ctx.measureText(nameToDraw).width > maxTextW
      ) {
        nameToDraw = `${nameToDraw.slice(0, -2).trimEnd()}…`
      }

      if (unitOrDept && !compact) {
        ctx.fillText(nameToDraw, textX, ry + rowH / 2 - 2)
        ctx.fillStyle = palette.textSecondary
        ctx.font = `500 ${metaSize}px "Inter", system-ui, -apple-system, sans-serif`
        let metaToDraw = unitOrDept
        while (
          metaToDraw.length > 4 &&
          ctx.measureText(metaToDraw).width > maxTextW
        ) {
          metaToDraw = `${metaToDraw.slice(0, -2).trimEnd()}…`
        }
        ctx.fillText(metaToDraw, textX, ry + rowH / 2 + metaSize + 4)
      } else {
        ctx.fillText(nameToDraw, textX, ry + rowH / 2 + nameSize * 0.35)
      }
    })
  }

  // Footer
  ctx.save()
  roundRect(ctx, cardX, cardY, cardW, cardH, 34)
  ctx.clip()
  ctx.fillStyle = palette.footerBg
  ctx.fillRect(cardX, footerY, cardW, footerHeight)
  ctx.fillStyle = palette.footerText
  ctx.textAlign = 'center'
  ctx.font = `600 ${isStory ? 22 : 17}px "Inter", system-ui, -apple-system, sans-serif`
  const footerText =
    options.subtitle.trim() ||
    'Parabéns a todos os aniversariantes! Saúde, sucesso e muitas realizações.'
  const footerLines = wrapTextLines(ctx, footerText, cardW - 100, 2)
  const lineH = isStory ? 30 : 24
  const startFooterTextY =
    footerY +
    footerHeight / 2 -
    ((footerLines.length - 1) * lineH) / 2 +
    (isStory ? 7 : 6)
  footerLines.forEach((line, idx) => {
    ctx.fillText(line, centerX, startFooterTextY + idx * lineH)
  })
  ctx.restore()
}

export function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Falha ao gerar imagem PNG.'))
          return
        }
        resolve(blob)
      },
      'image/png',
      1
    )
  })
}

export async function downloadCanvasPng(
  canvas: HTMLCanvasElement,
  filename: string
): Promise<void> {
  const blob = await canvasToPngBlob(canvas)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function copyCanvasPngToClipboard(
  canvas: HTMLCanvasElement
): Promise<void> {
  if (
    typeof navigator === 'undefined' ||
    !navigator.clipboard ||
    typeof ClipboardItem === 'undefined'
  ) {
    throw new Error(
      'Seu navegador não suporta cópia direta de imagem. Use o botão Baixar PNG.'
    )
  }
  const blob = await canvasToPngBlob(canvas)
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
}

export async function shareCanvasPng(
  canvas: HTMLCanvasElement,
  filename: string,
  title: string
): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.share) {
    return false
  }
  const blob = await canvasToPngBlob(canvas)
  const file = new File([blob], filename, { type: 'image/png' })
  if (navigator.canShare && !navigator.canShare({ files: [file] })) {
    return false
  }
  await navigator.share({
    title,
    files: [file],
  })
  return true
}

export function slugifyFilename(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
