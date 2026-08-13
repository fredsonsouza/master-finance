'use client'

import { Button } from '@/components/ui/button'
import { FileText } from 'lucide-react'
import { downloadRegulationPdf } from './download-regulation-pdf'

export function RegulationButton() {
  return (
    <Button
      variant="outline"
      onClick={downloadRegulationPdf}
      className="gap-2 border-primary/30 text-primary hover:bg-primary/5 font-semibold text-xs h-10 px-4 cursor-pointer shrink-0 shadow-sm"
    >
      <FileText className="h-4 w-4 text-primary" />
      Ver Regulamento (PDF)
    </Button>
  )
}
