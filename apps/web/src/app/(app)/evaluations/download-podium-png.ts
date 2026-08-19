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
  const width = 1080
  const height = 1920
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Format month name (e.g., "Agosto de 2026")
  const formattedMonth = dayjs(podiumMonth).format('MMMM [de] YYYY')
  const capitalizedMonth = formattedMonth.charAt(0).toUpperCase() + formattedMonth.slice(1)

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

  // 1. Background: Luxury Dark Gradient (Navy to Deep Slate)
  const bgGrad = ctx.createLinearGradient(0, 0, width, height)
  bgGrad.addColorStop(0, '#0b132b')
  bgGrad.addColorStop(0.4, '#1c2541')
  bgGrad.addColorStop(1, '#0b132b')
  ctx.fillStyle = bgGrad
  ctx.fillRect(0, 0, width, height)

  // Decorative ambient glow circles
  const goldGlow = ctx.createRadialGradient(width / 2, 280, 50, width / 2, 280, 450)
  goldGlow.addColorStop(0, 'rgba(245, 158, 11, 0.18)')
  goldGlow.addColorStop(1, 'rgba(245, 158, 11, 0)')
  ctx.fillStyle = goldGlow
  ctx.fillRect(0, 0, width, 700)

  const cyanGlow = ctx.createRadialGradient(width / 2, 1700, 50, width / 2, 1700, 500)
  cyanGlow.addColorStop(0, 'rgba(2, 132, 199, 0.15)')
  cyanGlow.addColorStop(1, 'rgba(2, 132, 199, 0)')
  ctx.fillStyle = cyanGlow
  ctx.fillRect(0, 1200, width, 720)

  // Top and Bottom decorative borders
  ctx.fillStyle = '#f59e0b'
  ctx.fillRect(0, 0, width, 12)
  ctx.fillStyle = '#0284c7'
  ctx.fillRect(0, height - 12, width, 12)

  // 2. Load Masterclin Logo
  const logo = new Image()
  logo.crossOrigin = 'anonymous'
  logo.src = '/images/masterclin-logo.png'

  const drawContent = () => {
    // Top Logo Container
    ctx.save()
    ctx.fillStyle = '#ffffff'
    roundRect(ctx, (width - 440) / 2, 60, 440, 110, 24)
    ctx.fill()
    ctx.shadowColor = 'rgba(0, 0, 0, 0.25)'
    ctx.shadowBlur = 15
    ctx.shadowOffsetY = 6

    if (logo.complete && logo.naturalHeight > 0) {
      const maxH = 80
      const maxW = 380
      let lW = logo.width
      let lH = logo.height
      if (lH > maxH) {
        lW = (maxH / lH) * lW
        lH = maxH
      }
      if (lW > maxW) {
        lH = (maxW / lW) * lH
        lW = maxW
      }
      ctx.drawImage(logo, (width - lW) / 2, 60 + (110 - lH) / 2, lW, lH)
    }
    ctx.restore()

    // Header Trophy Icon & Titles
    ctx.textAlign = 'center'

    // Crown / Trophy emoji or graphic
    ctx.font = '54px sans-serif'
    ctx.fillText('🏆', width / 2, 235)

    // Main Title
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 44px sans-serif'
    ctx.fillText('PÓDIO DA RECEPÇÃO', width / 2, 295)

    // Subtitle
    ctx.fillStyle = '#38bdf8'
    ctx.font = '600 24px sans-serif'
    ctx.fillText('DESTAQUES DE ATENDIMENTO AO CLIENTE', width / 2, 335)

    // Badge Pill with Unit & Month
    const infoText = `${unitName.toUpperCase()}  •  ${capitalizedMonth.toUpperCase()}`
    ctx.font = 'bold 20px sans-serif'
    const infoWidth = ctx.measureText(infoText).width + 60
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)'
    roundRect(ctx, (width - infoWidth) / 2, 365, infoWidth, 44, 22)
    ctx.fill()
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)'
    ctx.lineWidth = 1.5
    ctx.stroke()

    ctx.fillStyle = '#fbbf24'
    ctx.fillText(infoText, width / 2, 394)

    // 3. Winners Cards (1st, 2nd, 3rd)
    const cardStartX = 80
    const cardWidth = width - 160
    let currentY = 445

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
        borderGradStart: string
        borderGradEnd: string
        bgGradStart: string
        bgGradEnd: string
        titleColor: string
        cardHeight: number
      }
    > = {
      1: {
        medal: '🥇',
        title: '1º LUGAR — CAMPEÃO(Ã)',
        borderGradStart: '#fbbf24',
        borderGradEnd: '#f59e0b',
        bgGradStart: 'rgba(245, 158, 11, 0.22)',
        bgGradEnd: 'rgba(30, 41, 59, 0.85)',
        titleColor: '#fbbf24',
        cardHeight: 350,
      },
      2: {
        medal: '🥈',
        title: '2º LUGAR — DESTAQUE',
        borderGradStart: '#cbd5e1',
        borderGradEnd: '#94a3b8',
        bgGradStart: 'rgba(148, 163, 184, 0.18)',
        bgGradEnd: 'rgba(30, 41, 59, 0.85)',
        titleColor: '#e2e8f0',
        cardHeight: 330,
      },
      3: {
        medal: '🥉',
        title: '3º LUGAR — DESTAQUE',
        borderGradStart: '#fdba74',
        borderGradEnd: '#ea580c',
        bgGradStart: 'rgba(234, 88, 12, 0.18)',
        bgGradEnd: 'rgba(30, 41, 59, 0.85)',
        titleColor: '#fdba74',
        cardHeight: 330,
      },
    }

    if (podium.length === 0) {
      // Empty state
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)'
      roundRect(ctx, cardStartX, currentY, cardWidth, 300, 24)
      ctx.fill()
      ctx.fillStyle = '#94a3b8'
      ctx.font = '500 24px sans-serif'
      ctx.fillText('Nenhuma avaliação apurada para esta unidade neste mês.', width / 2, currentY + 160)
    } else {
      podium.forEach((item) => {
        const cfg = medalConfig[item.position] || medalConfig[3]
        const bonus = bonusMap[item.position] || 'R$ 0,00'
        const h = cfg.cardHeight

        // Card Background
        const cardBg = ctx.createLinearGradient(cardStartX, currentY, cardStartX + cardWidth, currentY + h)
        cardBg.addColorStop(0, cfg.bgGradStart)
        cardBg.addColorStop(1, cfg.bgGradEnd)
        ctx.fillStyle = cardBg
        roundRect(ctx, cardStartX, currentY, cardWidth, h, 28)
        ctx.fill()

        // Card Border Gradient
        const borderGrad = ctx.createLinearGradient(cardStartX, currentY, cardStartX + cardWidth, currentY)
        borderGrad.addColorStop(0, cfg.borderGradStart)
        borderGrad.addColorStop(1, cfg.borderGradEnd)
        ctx.strokeStyle = borderGrad
        ctx.lineWidth = item.position === 1 ? 3.5 : 2.5
        roundRect(ctx, cardStartX, currentY, cardWidth, h, 28)
        ctx.stroke()

        // Top Row inside Card: Medal & Position
        ctx.textAlign = 'left'
        ctx.font = '40px sans-serif'
        ctx.fillText(cfg.medal, cardStartX + 28, currentY + 60)

        ctx.fillStyle = cfg.titleColor
        ctx.font = 'bold 22px sans-serif'
        ctx.fillText(cfg.title, cardStartX + 85, currentY + 54)

        // Bonus Pill at Top Right of Card
        ctx.textAlign = 'right'
        ctx.fillStyle = '#10b981'
        ctx.font = 'bold 26px sans-serif'
        ctx.fillText(`+ ${bonus}`, cardStartX + cardWidth - 28, currentY + 55)

        ctx.fillStyle = '#6ee7b7'
        ctx.font = '600 13px sans-serif'
        ctx.fillText('BONIFICAÇÃO', cardStartX + cardWidth - 28, currentY + 74)

        // Seller Name (Big & Bold)
        ctx.textAlign = 'left'
        ctx.fillStyle = '#ffffff'
        ctx.font = item.position === 1 ? 'bold 38px sans-serif' : 'bold 34px sans-serif'
        ctx.fillText(item.sellerName, cardStartX + 30, currentY + 135)

        // Divider Line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(cardStartX + 30, currentY + 160)
        ctx.lineTo(cardStartX + cardWidth - 30, currentY + 160)
        ctx.stroke()

        // 3 Metrics Columns
        const colWidth = (cardWidth - 60) / 3

        // Col 1: Satisfaction
        ctx.fillStyle = '#34d399'
        ctx.font = 'bold 32px sans-serif'
        ctx.fillText(`${item.satisfactionRate}%`, cardStartX + 30, currentY + 215)
        ctx.fillStyle = '#94a3b8'
        ctx.font = '600 14px sans-serif'
        ctx.fillText('SATISFAÇÃO', cardStartX + 30, currentY + 240)

        // Col 2: Total Reviews
        ctx.fillStyle = '#38bdf8'
        ctx.font = 'bold 32px sans-serif'
        ctx.fillText(`${item.totalEvaluations}`, cardStartX + 30 + colWidth, currentY + 215)
        ctx.fillStyle = '#94a3b8'
        ctx.font = '600 14px sans-serif'
        ctx.fillText('AVALIAÇÕES', cardStartX + 30 + colWidth, currentY + 240)

        // Col 3: Score
        ctx.fillStyle = '#fbbf24'
        ctx.font = 'bold 32px sans-serif'
        ctx.fillText(`${item.score} pts`, cardStartX + 30 + colWidth * 2, currentY + 215)
        ctx.fillStyle = '#94a3b8'
        ctx.font = '600 14px sans-serif'
        ctx.fillText('PONTUAÇÃO', cardStartX + 30 + colWidth * 2, currentY + 240)

        // Breakdown note at bottom of card
        ctx.fillStyle = 'rgba(255, 255, 255, 0.65)'
        ctx.font = '14px sans-serif'
        ctx.fillText(
          `✨ ${item.excellentCount} avaliações Ótimas  •  ${item.goodCount} Boas`,
          cardStartX + 30,
          currentY + (item.position === 1 ? 295 : 285)
        )

        currentY += h + 24
      })
    }

    // 4. Bottom Motivational & Branding Footer
    ctx.textAlign = 'center'

    ctx.fillStyle = '#f8fafc'
    ctx.font = 'bold 22px sans-serif'
    ctx.fillText('Parabéns aos recepcionistas pelo atendimento exemplar!', width / 2, 1680)

    ctx.fillStyle = '#94a3b8'
    ctx.font = '500 17px sans-serif'
    ctx.fillText('Programa de Reconhecimento e Excelência — Clínica Masterclin', width / 2, 1715)

    // Trigger Download
    const dataUrl = canvas.toDataURL('image/png')
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = `podio-masterclin-${unitName.toLowerCase().replace(/\s+/g, '-')}-${podiumMonth}.png`
    link.click()
  }

  if (logo.complete) {
    drawContent()
  } else {
    logo.onload = () => drawContent()
    logo.onerror = () => drawContent()
  }
}
