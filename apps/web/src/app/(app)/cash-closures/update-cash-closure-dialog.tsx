'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import type { CashClosure } from '@/http/cash-closures'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { NumericFormat, PatternFormat } from 'react-number-format'
import { toast } from 'sonner'
import { updateCashClosure } from './actions'

interface Props {
  closure: CashClosure | null
  onClose: () => void
}

export function UpdateCashClosureDialog({ closure, onClose }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [cashDate, setCashDate] = useState('')
  const [value, setValue] = useState('')
  const [observation, setObservation] = useState('')
  const router = useRouter()
  const [prevClosure, setPrevClosure] = useState<CashClosure | null>(closure)

  if (closure !== prevClosure) {
    setPrevClosure(closure)
    if (closure) {
      const d = new Date(closure.cashDate)
      const day = String(d.getUTCDate()).padStart(2, '0')
      const month = String(d.getUTCMonth() + 1).padStart(2, '0')
      const year = d.getUTCFullYear()
      setCashDate(`${day}/${month}/${year}`)
      setValue(closure.value.toString())
      setObservation(closure.observation || '')
    } else {
      setCashDate('')
      setValue('')
      setObservation('')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!closure) return
    setIsSubmitting(true)

    const numValue = Number.parseFloat(value)

    if (Number.isNaN(numValue) || numValue < 0) {
      toast.error('Informe um valor válido.')
      setIsSubmitting(false)
      return
    }

    const [day, month, year] = cashDate.split('/')
    if (!day || !month || !year || year.length !== 4) {
      toast.error('Informe uma data válida no formato DD/MM/AAAA.')
      setIsSubmitting(false)
      return
    }

    const parsedDate = new Date(Number(year), Number(month) - 1, Number(day))
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (parsedDate >= today) {
      toast.error('A data do caixa deve ser anterior à data de hoje.')
      setIsSubmitting(false)
      return
    }

    const isoDate = parsedDate.toISOString()

    const result = await updateCashClosure(closure.id, {
      cashDate: isoDate,
      value: numValue,
      observation: observation || undefined,
    })

    if (result.success) {
      toast.success('Fechamento atualizado com sucesso!')
      router.refresh()
      onClose()
    } else {
      toast.error(result.message)
    }

    setIsSubmitting(false)
  }

  return (
    <Dialog open={closure !== null} onOpenChange={(val) => !val && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Fechamento de Caixa</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Data do Caixa</label>
            <PatternFormat
              format="##/##/####"
              mask="_"
              customInput={Input}
              value={cashDate}
              onValueChange={(values) => setCashDate(values.formattedValue)}
              placeholder="DD/MM/AAAA"
              className="bg-surface text-on-surface"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Valor Total</label>
            <NumericFormat
              customInput={Input}
              value={value}
              onValueChange={(values) => setValue(values.value)}
              thousandSeparator="."
              decimalSeparator=","
              prefix="R$ "
              decimalScale={2}
              fixedDecimalScale
              placeholder="R$ 0,00"
              className="bg-surface text-on-surface"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Observações</label>
            <Input
              type="text"
              placeholder="Opcional..."
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              className="bg-surface text-on-surface"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
