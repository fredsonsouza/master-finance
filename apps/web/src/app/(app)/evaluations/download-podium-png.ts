import type { PodiumItem } from '@/http/get-evaluations'
import dayjs from 'dayjs'
import 'dayjs/locale/pt-br'

dayjs.locale('pt-br')

interface ExportPodiumPngParams {
  podium: PodiumItem[]
  unitName: string
  podiumMonth: string // YYYY-MM
}

export async function downloadPodiumPng({
  podium,
  unitName,
  podiumMonth,
}: ExportPodiumPngParams) {
  const canvas = document.createElement('canvas')
  // Standard Instagram & Social Media Portrait Ratio (4:5) - 1080 x 1350 px
  const width = 1080
  const height = 1350
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Format month name (e.g., "Agosto de 2026")
  const formattedMonth = dayjs(podiumMonth).format('MMMM [de] YYYY')
  const capitalizedMonth =
    formattedMonth.charAt(0).toUpperCase() + formattedMonth.slice(1)

  function roundRect(
    c: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ) {
    c.beginPath()
    c.moveTo(x + r, y)
    c.arcTo(x + w, y, x + w, y + h, r)
    c.arcTo(x + w, y + h, x, y + h, r)
    c.arcTo(x, y + h, x, y, r)
    c.arcTo(x, y, x + w, y, r)
    c.closePath()
  }

  // 1. Clean Background (Crachá Style)
  // Outer subtle background gradient
  const outerBg = ctx.createLinearGradient(0, 0, width, height)
  outerBg.addColorStop(0, '#f1f5f9')
  outerBg.addColorStop(1, '#e2e8f0')
  ctx.fillStyle = outerBg
  ctx.fillRect(0, 0, width, height)

  // Main Card Body (White Crachá Card with Soft Shadow)
  ctx.save()
  ctx.fillStyle = '#ffffff'
  roundRect(ctx, 30, 30, width - 60, height - 60, 44)
  ctx.fill()
  ctx.lineWidth = 6
  ctx.strokeStyle = '#cbd5e1'
  ctx.stroke()
  ctx.restore()

  // 2. Badge Hole Slot at Top (Crachá Signature)
  ctx.fillStyle = '#e2e8f0'
  roundRect(ctx, (width - 240) / 2, 52, 240, 28, 14)
  ctx.fill()
  ctx.lineWidth = 2.5
  ctx.strokeStyle = '#94a3b8'
  ctx.stroke()

  // 3. Load & Draw Large Masterclin Logo
  const logo = new Image()
  logo.crossOrigin = 'anonymous'
  logo.src = '/images/masterclin-logo.png'

  const drawContent = () => {
    // Large prominent Masterclin Logo
    if (logo.complete && logo.naturalHeight > 0) {
      const maxLogoHeight = 135
      const maxLogoWidth = 580
      let logoW = logo.width
      let logoH = logo.height
      if (logoH > maxLogoHeight) {
        logoW = (maxLogoHeight / logoH) * logoW
        logoH = maxLogoHeight
      }
      if (logoW > maxLogoWidth) {
        logoH = (maxLogoWidth / logoW) * logoH
        logoW = maxLogoWidth
      }
      const logoX = (width - logoW) / 2
      const logoY = 95
      ctx.drawImage(logo, logoX, logoY, logoW, logoH)
    }

    // 4. Header: Destaques de Atendimento & Unit/Month Pill (No "PÓDIO DA RECEPÇÃO")
    ctx.textAlign = 'center'

    ctx.font = 'bold 30px system-ui, -apple-system, sans-serif'
    ctx.fillStyle = '#0284c7'
    ctx.fillText('DESTAQUES DO ATENDIMENTO', width / 2, 260)

    // Unit & Month Pill Badge
    const pillText = `UNIDADE ${unitName.toUpperCase()}  •  ${capitalizedMonth.toUpperCase()}`
    ctx.font = 'bold 20px system-ui, -apple-system, sans-serif'
    const pillWidth = ctx.measureText(pillText).width + 50
    ctx.fillStyle = '#f8fafc'
    roundRect(ctx, (width - pillWidth) / 2, 280, pillWidth, 40, 20)
    ctx.fill()
    ctx.lineWidth = 1.5
    ctx.strokeStyle = '#cbd5e1'
    ctx.stroke()

    ctx.fillStyle = '#334155'
    ctx.fillText(pillText, width / 2, 307)

    // 5. Winners Cards (1st, 2nd, 3rd)
    const cardStartX = 70
    const cardWidth = width - 140
    let currentY = 345

    const bonusMap: Record<number, string> = {
      1: 'R$ 400,00',
      2: 'R$ 300,00',
      3: 'R$ 200,00',
    }

    const medalConfig: Record<
      number,
      {
        medal: string
        title: string
        borderColor: string
        borderWidth: number
        bgColor: string
        titleColor: string
        cardHeight: number
      }
    > = {
      1: {
        medal: '🥇',
        title: '1º LUGAR — DESTAQUE #1',
        borderColor: '#f59e0b',
        borderWidth: 3.5,
        bgColor: '#fffbeb',
        titleColor: '#92400e',
        cardHeight: 260,
      },
      2: {
        medal: '🥈',
        title: '2º LUGAR — DESTAQUE #2',
        borderColor: '#94a3b8',
        borderWidth: 2.5,
        bgColor: '#f8fafc',
        titleColor: '#334155',
        cardHeight: 250,
      },
      3: {
        medal: '🥉',
        title: '3º LUGAR — DESTAQUE #3',
        borderColor: '#ea580c',
        borderWidth: 2.5,
        bgColor: '#fff7ed',
        titleColor: '#9a3412',
        cardHeight: 250,
      },
    }

    if (podium.length === 0) {
      // Empty state
      ctx.fillStyle = '#f8fafc'
      roundRect(ctx, cardStartX, currentY, cardWidth, 240, 24)
      ctx.fill()
      ctx.lineWidth = 2
      ctx.strokeStyle = '#cbd5e1'
      ctx.stroke()

      ctx.fillStyle = '#64748b'
      ctx.font = '500 24px system-ui, -apple-system, sans-serif'
      ctx.fillText(
        'Nenhuma avaliação apurada para esta unidade no período.',
        width / 2,
        currentY + 125
      )
    } else {
      podium.forEach((item) => {
        const cfg = medalConfig[item.position] || medalConfig[3]
        const bonus = bonusMap[item.position] || 'R$ 0,00'
        const h = cfg.cardHeight

        // Card Box
        ctx.fillStyle = cfg.bgColor
        roundRect(ctx, cardStartX, currentY, cardWidth, h, 24)
        ctx.fill()
        ctx.lineWidth = cfg.borderWidth
        ctx.strokeStyle = cfg.borderColor
        ctx.stroke()

        // Top Row inside Card: Medal, Position Title & Bonus
        ctx.textAlign = 'left'
        ctx.font = '36px sans-serif'
        ctx.fillText(cfg.medal, cardStartX + 24, currentY + 48)

        ctx.fillStyle = cfg.titleColor
        ctx.font = 'bold 20px system-ui, -apple-system, sans-serif'
        ctx.fillText(cfg.title, cardStartX + 72, currentY + 43)

        // Bonus Pill at Top Right of Card
        ctx.textAlign = 'right'
        ctx.fillStyle = '#059669'
        ctx.font = 'bold 24px system-ui, -apple-system, sans-serif'
        ctx.fillText(`Bonificação: ${bonus}`, cardStartX + cardWidth - 24, currentY + 44)

        // Seller Name (Big, Bold & High Contrast)
        ctx.textAlign = 'left'
        ctx.fillStyle = '#0f172a'
        ctx.font =
          item.position === 1
            ? '800 36px system-ui, -apple-system, sans-serif'
            : '800 32px system-ui, -apple-system, sans-serif'
        ctx.fillText(item.sellerName, cardStartX + 26, currentY + 105)

        // Subtle Divider Line
        ctx.strokeStyle = '#e2e8f0'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(cardStartX + 26, currentY + 125)
        ctx.lineTo(cardStartX + cardWidth - 26, currentY + 125)
        ctx.stroke()

        // 3 Metrics Columns
        const colWidth = (cardWidth - 52) / 3

        // Col 1: Satisfaction
        ctx.fillStyle = '#059669'
        ctx.font = 'bold 30px system-ui, -apple-system, sans-serif'
        ctx.fillText(`${item.satisfactionRate}%`, cardStartX + 26, currentY + 172)
        ctx.fillStyle = '#64748b'
        ctx.font = 'bold 13px system-ui, -apple-system, sans-serif'
        ctx.fillText('SATISFAÇÃO', cardStartX + 26, currentY + 195)

        // Col 2: Total Reviews
        ctx.fillStyle = '#0284c7'
        ctx.font = 'bold 30px system-ui, -apple-system, sans-serif'
        ctx.fillText(`${item.totalEvaluations}`, cardStartX + 26 + colWidth, currentY + 172)
        ctx.fillStyle = '#64748b'
        ctx.font = 'bold 13px system-ui, -apple-system, sans-serif'
        ctx.fillText('AVALIAÇÕES', cardStartX + 26 + colWidth, currentY + 195)

        // Col 3: Score
        ctx.fillStyle = '#d97706'
        ctx.font = 'bold 30px system-ui, -apple-system, sans-serif'
        ctx.fillText(`${item.score} pts`, cardStartX + 26 + colWidth * 2, currentY + 172)
        ctx.fillStyle = '#64748b'
        ctx.font = 'bold 13px system-ui, -apple-system, sans-serif'
        ctx.fillText('PONTUAÇÃO', cardStartX + 26 + colWidth * 2, currentY + 195)

        // Breakdown note
        ctx.fillStyle = '#475569'
        ctx.font = '500 13.5px system-ui, -apple-system, sans-serif'
        ctx.fillText(
          `✨ ${item.excellentCount} avaliações Ótimas  •  ${item.goodCount} Boas`,
          cardStartX + 26,
          currentY + (item.position === 1 ? 232 : 225)
        )

        currentY += h + 20
      })
    }

    // 6. Bottom Motivational & Branding Footer
    ctx.textAlign = 'center'

    ctx.fillStyle = '#334155'
    ctx.font = 'bold 19px system-ui, -apple-system, sans-serif'
    ctx.fillText(
      'Parabéns aos recepcionistas pelo atendimento exemplar!',
      width / 2,
      1240
    )

    ctx.fillStyle = '#64748b'
    ctx.font = '500 15px system-ui, -apple-system, sans-serif'
    ctx.fillText(
      'Clínica Masterclin • Reconhecimento e Excelência no Atendimento',
      width / 2,
      1270
    )

    // Trigger Download
    const dataUrl = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = `destaques-atendimento-${unitName.toLowerCase().replace(/\s+/g, '-')}-${podiumMonth}.png`
    link.click()
  }

  if (logo.complete) {
    drawContent()
  } else {
    logo.onload = () => drawContent()
    logo.onerror = () => drawContent()
  }
}
