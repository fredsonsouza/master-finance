'use client'

import { Button } from '@/components/ui/button'
import { FileText, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { downloadRegulationPdf } from './download-regulation-pdf'

export function RegulationButton() {
  const [isDownloading, setIsDownloading] = useState(false)

  async function handleDownload() {
    setIsDownloading(true)
    try {
      await downloadRegulationPdf()
    } catch {
      toast.error('Erro ao baixar o regulamento em PDF.')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <Button
      variant="outline"
      onClick={handleDownload}
      disabled={isDownloading}
      className="gap-2 border-primary/30 text-primary hover:bg-primary/5 font-semibold text-xs h-10 px-4 cursor-pointer shrink-0 shadow-sm"
    >
      {isDownloading ? (
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
      ) : (
        <FileText className="h-4 w-4 text-primary" />
      )}
      Ver Regulamento (PDF)
    </Button>
  )
}
