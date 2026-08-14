'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Copy, Download, ExternalLink, Printer, QrCode } from 'lucide-react'
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react'
import { useRef } from 'react'
import { toast } from 'sonner'

interface Props {
  sellerId: string
  sellerName: string
}

export function QrCodeCard({ sellerId, sellerName }: Props) {
  const canvasRef = useRef<HTMLDivElement>(null)

  const baseUrl =
    typeof window !== 'undefined' ? window.location.origin : ''
  const evaluationUrl = sellerId ? `${baseUrl}/evaluate/${sellerId}` : ''

  function handleCopyLink() {
    if (!evaluationUrl) return
    navigator.clipboard.writeText(evaluationUrl)
    toast.success('Link de avaliação copiado para a área de transferência!')
  }

  function handleDownloadPng() {
    if (!evaluationUrl) return

    const qrCanvas = canvasRef.current?.querySelector('canvas')
    if (!qrCanvas) {
      toast.error('Aguarde o carregamento do QR Code.')
      return
    }

    const exportCanvas = document.createElement('canvas')
    exportCanvas.width = 600
    exportCanvas.height = 940
    const ctx = exportCanvas.getContext('2d')
    if (!ctx) return

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

    // 1. White Background & Card Border
    ctx.fillStyle = '#ffffff'
    roundRect(ctx, 15, 15, 570, 910, 36)
    ctx.fill()
    ctx.lineWidth = 6
    ctx.strokeStyle = '#cbd5e1'
    ctx.stroke()

    // 2. Badge Hole Slot at Top
    ctx.fillStyle = '#e2e8f0'
    roundRect(ctx, 230, 40, 140, 24, 12)
    ctx.fill()
    ctx.lineWidth = 2
    ctx.strokeStyle = '#94a3b8'
    ctx.stroke()

    // 3. Load & Draw Masterclin Logo
    const logo = new Image()
    logo.crossOrigin = 'anonymous'
    logo.src = '/images/masterclin-logo.png'

    const executeDownload = () => {
      const image = exportCanvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.href = image
      link.download = `cracha-atendimento-${sellerName.toLowerCase().replace(/\s+/g, '-')}.png`
      link.click()
      toast.success('Download do Crachá Completo (PNG) iniciado!')
    }

    logo.onload = () => {
      const maxLogoHeight = 135
      const maxLogoWidth = 460
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

      const logoX = (600 - logoW) / 2
      const logoY = 90
      ctx.drawImage(logo, logoX, logoY, logoW, logoH)

      // 4. Title Text
      ctx.font = 'bold 22px system-ui, -apple-system, sans-serif'
      ctx.fillStyle = '#64748b'
      ctx.textAlign = 'center'
      ctx.fillText('AVALIE MEU ATENDIMENTO', 300, 255)

      // 5. Receptionist Name
      ctx.font = '800 34px system-ui, -apple-system, sans-serif'
      ctx.fillStyle = '#0284c7'
      ctx.fillText(sellerName, 300, 305)

      // 6. QR Code Container Box
      ctx.fillStyle = '#f8fafc'
      roundRect(ctx, 100, 340, 400, 400, 28)
      ctx.fill()
      ctx.lineWidth = 3
      ctx.strokeStyle = '#e2e8f0'
      ctx.stroke()

      // 7. Draw QR Code Canvas
      ctx.drawImage(qrCanvas, 120, 360, 360, 360)

      // 8. Footer Tagline
      ctx.font = 'bold 18px system-ui, -apple-system, sans-serif'
      ctx.fillStyle = '#94a3b8'
      ctx.fillText('ESCANEIE COM A CÂMERA', 300, 875)

      executeDownload()
    }

    logo.onerror = () => {
      ctx.font = 'bold 22px system-ui, -apple-system, sans-serif'
      ctx.fillStyle = '#64748b'
      ctx.textAlign = 'center'
      ctx.fillText('AVALIE MEU ATENDIMENTO', 300, 200)

      ctx.font = '800 34px system-ui, -apple-system, sans-serif'
      ctx.fillStyle = '#0284c7'
      ctx.fillText(sellerName, 300, 260)

      ctx.drawImage(qrCanvas, 120, 320, 360, 360)

      executeDownload()
    }
  }

  function handlePrint() {
    const printWindow = window.open('', '_blank')
    if (!printWindow || !evaluationUrl) return

    const logoUrl = `${window.location.origin}/images/masterclin-logo.png`

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Crachá QR Code - ${sellerName}</title>
          <style>
            @page {
              size: 54mm 86mm;
              margin: 0;
            }
            body {
              font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              padding: 0;
              background-color: #f8fafc;
            }
            .badge-card {
              width: 54mm;
              height: 86mm;
              box-sizing: border-box;
              padding: 4mm 3mm;
              border: 1.5px solid #cbd5e1;
              border-radius: 4mm;
              background: #ffffff;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: space-between;
              text-align: center;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
            }
            .badge-hole {
              width: 14mm;
              height: 2.5mm;
              background: #e2e8f0;
              border: 1px solid #cbd5e1;
              border-radius: 2mm;
              margin-bottom: 1.5mm;
            }
            .clinic-logo {
              max-height: 16mm;
              max-width: 44mm;
              width: auto;
              display: block;
              margin: 0 auto 1mm auto;
              object-fit: contain;
            }
            .title {
              font-size: 7.5pt;
              color: #475569;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.3px;
              margin: 0;
            }
            .seller-name {
              font-size: 11pt;
              color: #0284c7;
              font-weight: 800;
              line-height: 1.1;
              margin: 0.5mm 0 2mm 0;
              display: block;
            }
            #qr {
              display: flex;
              justify-content: center;
              margin: 0 auto;
            }
            .footer-tag {
              font-size: 6.5pt;
              color: #94a3b8;
              font-weight: 600;
              text-transform: uppercase;
              margin-top: 1mm;
            }
            @media print {
              body { background: transparent; }
              .badge-card { box-shadow: none; border-color: #94a3b8; }
            }
          </style>
        </head>
        <body>
          <div class="badge-card">
            <div style="display: flex; flex-direction: column; align-items: center; width: 100%;">
              <div class="badge-hole"></div>
              <img src="${logoUrl}" class="clinic-logo" alt="Logo Masterclin" />
              <p class="title">Avalie meu Atendimento</p>
              <span class="seller-name">${sellerName}</span>
            </div>
            <div id="qr"></div>
            <div class="footer-tag">Escaneie com a Câmera</div>
          </div>
          <script src="https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js"></script>
          <script>
            var typeNumber = 0;
            var errorCorrectionLevel = 'L';
            var qr = qrcode(typeNumber, errorCorrectionLevel);
            qr.addData('${evaluationUrl}');
            qr.make();
            document.getElementById('qr').innerHTML = qr.createImgTag(4);
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  if (!evaluationUrl) return null

  return (
    <Card className="border-primary/20 bg-surface shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-bold text-primary">
          <QrCode className="h-5 w-5" />
          Seu QR Code de Atendimento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 flex flex-col items-center">
        {/* CR80 Standard Vertical ID Badge Container */}
        <div className="w-[260px] h-[410px] rounded-2xl bg-white border-2 border-slate-200/90 p-4 shadow-md text-slate-900 flex flex-col items-center justify-between text-center relative transition-all hover:shadow-lg">
          {/* Badge Hole Punch Slot */}
          <div className="w-12 h-2.5 rounded-full bg-slate-200 border border-slate-300 shadow-inner" />

          {/* Logo & Seller Header */}
          <div className="w-full flex flex-col items-center">
            <img
              src="/images/masterclin-logo.png"
              alt="Logo Masterclin"
              className="h-16 max-w-[210px] w-auto object-contain my-1"
            />
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Avalie meu Atendimento
            </p>
            <p className="text-base font-extrabold text-sky-600 leading-tight mt-0.5">
              {sellerName}
            </p>
          </div>

          {/* QR Code Graphic */}
          <div className="p-2 bg-slate-50 border border-slate-200/80 rounded-xl shadow-inner">
            <QRCodeSVG value={evaluationUrl} size={150} level="H" />
          </div>

          <div ref={canvasRef} className="hidden">
            <QRCodeCanvas value={evaluationUrl} size={300} level="H" />
          </div>

          {/* Footer Label */}
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
            Escaneie com a Câmera
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2 w-full pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            className="gap-1.5 text-xs cursor-pointer"
          >
            <Copy className="h-3.5 w-3.5" />
            Copiar Link
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPng}
            className="gap-1.5 text-xs cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            Baixar Crachá (PNG)
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="gap-1.5 text-xs cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5" />
            Imprimir Crachá
          </Button>
          <a href={evaluationUrl} target="_blank" rel="noreferrer">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-primary cursor-pointer">
              <ExternalLink className="h-3.5 w-3.5" />
              Testar
            </Button>
          </a>
        </div>
      </CardContent>
    </Card>
  )
}
