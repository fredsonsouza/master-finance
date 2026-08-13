'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Copy, Download, ExternalLink, Printer, QrCode } from 'lucide-react'
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

interface Props {
  sellerId: string
  sellerName: string
}

export function QrCodeCard({ sellerId, sellerName }: Props) {
  const [evaluationUrl, setEvaluationUrl] = useState('')
  const canvasRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
      setEvaluationUrl(`${baseUrl}/evaluate/${sellerId}`)
    }
  }, [sellerId])

  function handleCopyLink() {
    if (!evaluationUrl) return
    navigator.clipboard.writeText(evaluationUrl)
    toast.success('Link de avaliação copiado!')
  }

  function handleDownloadPng() {
    const canvas = canvasRef.current?.querySelector('canvas')
    if (!canvas) return
    const url = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = `qrcode-atendimento-${sellerName.toLowerCase().replace(/\s+/g, '-')}.png`
    a.click()
  }

  function handlePrint() {
    const printWindow = window.open('', '_blank')
    if (!printWindow || !evaluationUrl) return

    const logoUrl = `${window.location.origin}/images/masterclin-logo.png`

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code - ${sellerName}</title>
          <style>
            body {
              font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              text-align: center;
              background-color: #f8fafc;
            }
            .card {
              border: 2px solid #cbd5e1;
              padding: 32px 32px 40px 32px;
              border-radius: 20px;
              max-width: 360px;
              background: #ffffff;
              box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
            }
            .clinic-logo {
              max-height: 140px;
              max-width: 320px;
              width: 100%;
              height: auto;
              margin: 0 auto 16px auto;
              display: block;
              object-fit: contain;
            }
            h1 { font-size: 22px; color: #0f172a; margin-top: 0; margin-bottom: 6px; font-weight: 800; }
            .seller-info { font-size: 15px; color: #475569; margin-top: 0; margin-bottom: 24px; font-weight: 500; }
            .seller-name { font-size: 22px; color: #0284c7; font-weight: 800; display: block; margin-top: 4px; }
            #qr { display: flex; justify-content: center; margin: 0 auto; }
          </style>
        </head>
        <body>
          <div class="card">
            <img src="${logoUrl}" class="clinic-logo" alt="Logo Masterclin" />
            <h1>Avalie meu Atendimento</h1>
            <div class="seller-info">
              Atendente:
              <span class="seller-name">${sellerName}</span>
            </div>
            <div id="qr"></div>
          </div>
          <script src="https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js"></script>
          <script>
            var typeNumber = 0;
            var errorCorrectionLevel = 'L';
            var qr = qrcode(typeNumber, errorCorrectionLevel);
            qr.addData('${evaluationUrl}');
            qr.make();
            document.getElementById('qr').innerHTML = qr.createImgTag(7);
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
      <CardContent className="space-y-4">
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white border border-slate-200/90 p-6 shadow-sm text-slate-900">
          <img
            src="/images/masterclin-logo.png"
            alt="Logo Masterclin"
            className="h-36 max-w-[320px] w-full object-contain mb-4"
          />
          <QRCodeSVG value={evaluationUrl} size={180} level="H" />
          <div ref={canvasRef} className="hidden">
            <QRCodeCanvas value={evaluationUrl} size={300} level="H" />
          </div>
          <p className="mt-3 text-base font-extrabold text-slate-900">
            {sellerName}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCopyLink} className="gap-1.5 text-xs">
            <Copy className="h-3.5 w-3.5" />
            Copiar Link
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadPng} className="gap-1.5 text-xs">
            <Download className="h-3.5 w-3.5" />
            Baixar PNG
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5 text-xs">
            <Printer className="h-3.5 w-3.5" />
            Imprimir
          </Button>
          <a href={evaluationUrl} target="_blank" rel="noreferrer">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-primary">
              <ExternalLink className="h-3.5 w-3.5" />
              Testar
            </Button>
          </a>
        </div>
      </CardContent>
    </Card>
  )
}
