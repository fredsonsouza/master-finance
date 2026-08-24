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
  // Standard Instagram & Social Media High-Res Portrait Ratio (4:5) - 1080 x 1350 px
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

  // 1. Deep Modern Luxury Gradient Background
  const bgGradient = ctx.createLinearGradient(0, 0, 0, height)
  bgGradient.addColorStop(0, '#091326')
  bgGradient.addColorStop(0.4, '#0f172a')
  bgGradient.addColorStop(1, '#080d1a')
  ctx.fillStyle = bgGradient
  ctx.fillRect(0, 0, width, height)

  // 2. Ambient Golden / Cyan Glowing Orbs
  const glow1 = ctx.createRadialGradient(width / 2, 420, 20, width / 2, 420, 480)
  glow1.addColorStop(0, 'rgba(245, 158, 11, 0.14)')
  glow1.addColorStop(1, 'rgba(245, 158, 11, 0)')
  ctx.fillStyle = glow1
  ctx.fillRect(0, 0, width, height)

  const glow2 = ctx.createRadialGradient(width / 2, 1000, 20, width / 2, 1000, 420)
  glow2.addColorStop(0, 'rgba(2, 132, 199, 0.10)')
  glow2.addColorStop(1, 'rgba(2, 132, 199, 0)')
  ctx.fillStyle = glow2
  ctx.fillRect(0, 0, width, height)

  // Subtle border outline for the whole canvas
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)'
  ctx.lineWidth = 2
  roundRect(ctx, 20, 20, width - 40, height - 40, 32)
  ctx.stroke()

  // 3. Load Masterclin Logo
  const logo = new Image()
  logo.crossOrigin = 'anonymous'
  logo.src = '/images/masterclin-logo.png'

  const drawContent = () => {
    // 4. Logo in floating frosted white capsule
    const logoCardW = 340
    const logoCardH = 86
    const logoCardX = (width - logoCardW) / 2
    const logoCardY = 48

    ctx.fillStyle = '#ffffff'
    ctx.shadowColor = 'rgba(0, 0, 0, 0.35)'
    ctx.shadowBlur = 18
    ctx.shadowOffsetY = 6
    roundRect(ctx, logoCardX, logoCardY, logoCardW, logoCardH, 20)
    ctx.fill()
    ctx.shadowColor = 'transparent'

    if (logo.complete && logo.naturalHeight > 0) {
      const maxLogoH = 68
      const maxLogoW = 300
      let logoW = logo.width
      let logoH = logo.height
      if (logoH > maxLogoH) {
        logoW = (maxLogoH / logoH) * logoW
        logoH = maxLogoH
      }
      if (logoW > maxLogoW) {
        logoH = (maxLogoW / logoW) * logoH
        logoW = maxLogoW
      }
      const logoX = logoCardX + (logoCardW - logoW) / 2
      const logoY = logoCardY + (logoCardH - logoH) / 2
      ctx.drawImage(logo, logoX, logoY, logoW, logoH)
    }

    // 5. Title & Unit Badge
    ctx.textAlign = 'center'

    // Main Title with slight gold glow
    ctx.fillStyle = '#ffffff'
    ctx.font = '900 32px system-ui, -apple-system, sans-serif'
    ctx.fillText('DESTAQUES DO ATENDIMENTO', width / 2, 182)

    // Pill with Unit and Month
    const pillText = `UNIDADE ${unitName.toUpperCase()}  •  ${capitalizedMonth.toUpperCase()}`
    ctx.font = 'bold 17px system-ui, -apple-system, sans-serif'
    const pillWidth = ctx.measureText(pillText).width + 44
    const pillHeight = 36
    const pillX = (width - pillWidth) / 2
    const pillY = 200

    ctx.fillStyle = 'rgba(2, 132, 199, 0.18)'
    roundRect(ctx, pillX, pillY, pillWidth, pillHeight, 18)
    ctx.fill()
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)'
    ctx.lineWidth = 1.5
    ctx.stroke()

    ctx.fillStyle = '#38bdf8'
    ctx.fillText(pillText, width / 2, pillY + 24)

    const bonusMap: Record<number, string> = {
      1: 'R$ 400,00',
      2: 'R$ 300,00',
      3: 'R$ 200,00',
    }

    if (podium.length === 0) {
      // Empty state
      ctx.fillStyle = 'rgba(30, 41, 59, 0.8)'
      roundRect(ctx, 80, 450, width - 160, 240, 24)
      ctx.fill()
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
      ctx.lineWidth = 2
      ctx.stroke()

      ctx.fillStyle = '#94a3b8'
      ctx.font = '500 24px system-ui, -apple-system, sans-serif'
      ctx.fillText(
        'Nenhuma avaliação apurada para esta unidade no período.',
        width / 2,
        580
      )
    } else {
      const item1 = podium.find((p) => p.position === 1)
      const item2 = podium.find((p) => p.position === 2)
      const item3 = podium.find((p) => p.position === 3)

      // ==========================================
      // 6. HERO CARD - 1º LUGAR (CAMPEÃ / CAMPEÃO)
      // ==========================================
      if (item1) {
        const cX = 60
        const cY = 265
        const cW = width - 120
        const cH = 360

        // Card Glow Shadow
        ctx.shadowColor = 'rgba(245, 158, 11, 0.35)'
        ctx.shadowBlur = 24
        ctx.shadowOffsetY = 8

        // Gold Gradient Background
        const goldCardBg = ctx.createLinearGradient(cX, cY, cX + cW, cY + cH)
        goldCardBg.addColorStop(0, '#1c1917')
        goldCardBg.addColorStop(0.5, '#292014')
        goldCardBg.addColorStop(1, '#1f1910')
        ctx.fillStyle = goldCardBg
        roundRect(ctx, cX, cY, cW, cH, 28)
        ctx.fill()

        // Gold Border
        const goldBorder = ctx.createLinearGradient(cX, cY, cX + cW, cY + cH)
        goldBorder.addColorStop(0, '#fbbf24')
        goldBorder.addColorStop(0.5, '#f59e0b')
        goldBorder.addColorStop(1, '#d97706')
        ctx.strokeStyle = goldBorder
        ctx.lineWidth = 3.5
        ctx.stroke()
        ctx.shadowColor = 'transparent'

        // Badge: 1º Lugar Header inside Card
        ctx.textAlign = 'left'
        ctx.fillStyle = '#fbbf24'
        ctx.font = 'bold 20px system-ui, -apple-system, sans-serif'
        ctx.fillText('🥇 1º LUGAR — ATENDENTE DESTAQUE', cX + 32, cY + 48)

        // Bonus Tag Top Right
        const bText = `BONIFICAÇÃO: ${bonusMap[1]}`
        ctx.font = '800 18px system-ui, -apple-system, sans-serif'
        const bWidth = ctx.measureText(bText).width + 36
        const bX = cX + cW - bWidth - 28
        const bY = cY + 24
        const goldPill = ctx.createLinearGradient(bX, bY, bX + bWidth, bY + 38)
        goldPill.addColorStop(0, '#f59e0b')
        goldPill.addColorStop(1, '#d97706')
        ctx.fillStyle = goldPill
        roundRect(ctx, bX, bY, bWidth, 38, 19)
        ctx.fill()

        ctx.fillStyle = '#ffffff'
        ctx.fillText(bText, bX + 18, bY + 25)

        // Seller Name (Giant, Bold & High Contrast)
        ctx.fillStyle = '#ffffff'
        ctx.font = '800 38px system-ui, -apple-system, sans-serif'
        ctx.fillText(item1.sellerName, cX + 32, cY + 118)

        // Divider Line
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.25)'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(cX + 32, cY + 145)
        ctx.lineTo(cX + cW - 32, cY + 145)
        ctx.stroke()

        // 2 Key Metric Blocks inside Gold Card
        const metricBoxW = (cW - 84) / 2
        const metricBoxH = 120
        const mY = cY + 165

        // Metric 1: Satisfaction
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)'
        roundRect(ctx, cX + 32, mY, metricBoxW, metricBoxH, 18)
        ctx.fill()
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)'
        ctx.lineWidth = 1.5
        ctx.stroke()

        ctx.fillStyle = '#34d399'
        ctx.font = '900 44px system-ui, -apple-system, sans-serif'
        ctx.fillText(`${item1.satisfactionRate}%`, cX + 52, mY + 58)

        ctx.fillStyle = '#a7f3d0'
        ctx.font = 'bold 15px system-ui, -apple-system, sans-serif'
        ctx.fillText('NÍVEL DE SATISFAÇÃO', cX + 52, mY + 90)

        // Metric 2: Total Reviews
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)'
        roundRect(ctx, cX + 32 + metricBoxW + 20, mY, metricBoxW, metricBoxH, 18)
        ctx.fill()
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)'
        ctx.lineWidth = 1.5
        ctx.stroke()

        ctx.fillStyle = '#38bdf8'
        ctx.font = '900 44px system-ui, -apple-system, sans-serif'
        ctx.fillText(`${item1.totalEvaluations}`, cX + 52 + metricBoxW + 20, mY + 58)

        ctx.fillStyle = '#bae6fd'
        ctx.font = 'bold 15px system-ui, -apple-system, sans-serif'
        ctx.fillText('TOTAL DE AVALIAÇÕES', cX + 52 + metricBoxW + 20, mY + 90)

        // Breakdown Footer inside 1st Card
        ctx.fillStyle = '#fde68a'
        ctx.font = '600 15px system-ui, -apple-system, sans-serif'
        ctx.fillText(
          `✨ ${item1.excellentCount} avaliações Ótimas  •  ${item1.goodCount} avaliações Boas`,
          cX + 36,
          cY + 322
        )
      }

      // =======================================================
      // 7. CARDS 2º E 3º LUGAR (SIDE-BY-SIDE DUAL PODIUM GRID)
      // =======================================================
      const sideCardsY = 650
      const sideCardW = (width - 145) / 2
      const sideCardH = 430

      // Card 2º Lugar (Silver)
      if (item2) {
        const c2X = 60
        const c2Y = sideCardsY

        // Silver Gradient Background
        const silverBg = ctx.createLinearGradient(c2X, c2Y, c2X + sideCardW, c2Y + sideCardH)
        silverBg.addColorStop(0, '#1e293b')
        silverBg.addColorStop(1, '#0f172a')
        ctx.fillStyle = silverBg
        roundRect(ctx, c2X, c2Y, sideCardW, sideCardH, 24)
        ctx.fill()

        ctx.strokeStyle = '#94a3b8'
        ctx.lineWidth = 2.5
        ctx.stroke()

        // Badge 2º Lugar
        ctx.textAlign = 'left'
        ctx.fillStyle = '#cbd5e1'
        ctx.font = 'bold 17px system-ui, -apple-system, sans-serif'
        ctx.fillText('🥈 2º LUGAR', c2X + 24, c2Y + 40)

        // Bonus Pill
        ctx.textAlign = 'right'
        ctx.fillStyle = '#34d399'
        ctx.font = 'bold 17px system-ui, -apple-system, sans-serif'
        ctx.fillText(bonusMap[2], c2X + sideCardW - 24, c2Y + 40)

        // Name
        ctx.textAlign = 'left'
        ctx.fillStyle = '#ffffff'
        ctx.font = '800 25px system-ui, -apple-system, sans-serif'
        ctx.fillText(item2.sellerName, c2X + 24, c2Y + 92)

        // Divider
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(c2X + 24, c2Y + 115)
        ctx.lineTo(c2X + sideCardW - 24, c2Y + 115)
        ctx.stroke()

        // Metric 1: Satisfaction
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
        roundRect(ctx, c2X + 24, c2Y + 135, sideCardW - 48, 90, 16)
        ctx.fill()

        ctx.fillStyle = '#34d399'
        ctx.font = '900 36px system-ui, -apple-system, sans-serif'
        ctx.fillText(`${item2.satisfactionRate}%`, c2X + 42, c2Y + 180)

        ctx.fillStyle = '#94a3b8'
        ctx.font = 'bold 13px system-ui, -apple-system, sans-serif'
        ctx.fillText('NÍVEL DE SATISFAÇÃO', c2X + 42, c2Y + 205)

        // Metric 2: Total Reviews
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
        roundRect(ctx, c2X + 24, c2Y + 240, sideCardW - 48, 90, 16)
        ctx.fill()

        ctx.fillStyle = '#38bdf8'
        ctx.font = '900 36px system-ui, -apple-system, sans-serif'
        ctx.fillText(`${item2.totalEvaluations}`, c2X + 42, c2Y + 285)

        ctx.fillStyle = '#94a3b8'
        ctx.font = 'bold 13px system-ui, -apple-system, sans-serif'
        ctx.fillText('TOTAL DE AVALIAÇÕES', c2X + 42, c2Y + 310)

        // Breakdown note
        ctx.fillStyle = '#cbd5e1'
        ctx.font = '500 13px system-ui, -apple-system, sans-serif'
        ctx.fillText(
          `✨ ${item2.excellentCount} Ótimas • ${item2.goodCount} Boas`,
          c2X + 26,
          c2Y + 380
        )
      }

      // Card 3º Lugar (Bronze)
      if (item3) {
        const c3X = 60 + sideCardW + 25
        const c3Y = sideCardsY

        // Bronze Gradient Background
        const bronzeBg = ctx.createLinearGradient(c3X, c3Y, c3X + sideCardW, c3Y + sideCardH)
        bronzeBg.addColorStop(0, '#1c1512')
        bronzeBg.addColorStop(1, '#0f172a')
        ctx.fillStyle = bronzeBg
        roundRect(ctx, c3X, c3Y, sideCardW, sideCardH, 24)
        ctx.fill()

        ctx.strokeStyle = '#ea580c'
        ctx.lineWidth = 2.5
        ctx.stroke()

        // Badge 3º Lugar
        ctx.textAlign = 'left'
        ctx.fillStyle = '#fdba74'
        ctx.font = 'bold 17px system-ui, -apple-system, sans-serif'
        ctx.fillText('🥉 3º LUGAR', c3X + 24, c3Y + 40)

        // Bonus Pill
        ctx.textAlign = 'right'
        ctx.fillStyle = '#34d399'
        ctx.font = 'bold 17px system-ui, -apple-system, sans-serif'
        ctx.fillText(bonusMap[3], c3X + sideCardW - 24, c3Y + 40)

        // Name
        ctx.textAlign = 'left'
        ctx.fillStyle = '#ffffff'
        ctx.font = '800 25px system-ui, -apple-system, sans-serif'
        ctx.fillText(item3.sellerName, c3X + 24, c3Y + 92)

        // Divider
        ctx.strokeStyle = 'rgba(234, 88, 12, 0.25)'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(c3X + 24, c3Y + 115)
        ctx.lineTo(c3X + sideCardW - 24, c3Y + 115)
        ctx.stroke()

        // Metric 1: Satisfaction
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
        roundRect(ctx, c3X + 24, c3Y + 135, sideCardW - 48, 90, 16)
        ctx.fill()

        ctx.fillStyle = '#34d399'
        ctx.font = '900 36px system-ui, -apple-system, sans-serif'
        ctx.fillText(`${item3.satisfactionRate}%`, c3X + 42, c3Y + 180)

        ctx.fillStyle = '#94a3b8'
        ctx.font = 'bold 13px system-ui, -apple-system, sans-serif'
        ctx.fillText('NÍVEL DE SATISFAÇÃO', c3X + 42, c3Y + 205)

        // Metric 2: Total Reviews
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
        roundRect(ctx, c3X + 24, c3Y + 240, sideCardW - 48, 90, 16)
        ctx.fill()

        ctx.fillStyle = '#38bdf8'
        ctx.font = '900 36px system-ui, -apple-system, sans-serif'
        ctx.fillText(`${item3.totalEvaluations}`, c3X + 42, c3Y + 285)

        ctx.fillStyle = '#94a3b8'
        ctx.font = 'bold 13px system-ui, -apple-system, sans-serif'
        ctx.fillText('TOTAL DE AVALIAÇÕES', c3X + 42, c3Y + 310)

        // Breakdown note
        ctx.fillStyle = '#fed7aa'
        ctx.font = '500 13px system-ui, -apple-system, sans-serif'
        ctx.fillText(
          `✨ ${item3.excellentCount} Ótimas • ${item3.goodCount} Boas`,
          c3X + 26,
          c3Y + 380
        )
      }
    }

    // ==========================================
    // 8. LUXURY BOTTOM FOOTER
    // ==========================================
    ctx.textAlign = 'center'

    ctx.fillStyle = '#f8fafc'
    ctx.font = 'bold 20px system-ui, -apple-system, sans-serif'
    ctx.fillText(
      '⭐ Parabéns aos recepcionistas pelo atendimento de excelência! ⭐',
      width / 2,
      1210
    )

    ctx.fillStyle = '#94a3b8'
    ctx.font = '500 15px system-ui, -apple-system, sans-serif'
    ctx.fillText(
      'Clínica Masterclin • Gestão da Qualidade & Experiência do Paciente',
      width / 2,
      1242
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
