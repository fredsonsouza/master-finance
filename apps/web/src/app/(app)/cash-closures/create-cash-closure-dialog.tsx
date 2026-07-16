'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import type { Sector } from '@/http/get-sectors'
import type { User } from '@/http/get-users'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { NumericFormat, PatternFormat } from 'react-number-format'
import { toast } from 'sonner'
import { createCashClosure } from './actions'

interface Props {
  open: boolean
  onClose: () => void
  sectors: Sector[]
  users: User[]
}

export function CreateCashClosureDialog({ open, onClose, users }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [cashDate, setCashDate] = useState('')
  const [value, setValue] = useState('')
  const [observation, setObservation] = useState('')
  const [selectedUserId, setSelectedUserId] = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
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
      toast.error('Só é permitido enviar caixas de dias anteriores.')
      setIsSubmitting(false)
      return
    }

    const isoDate = parsedDate.toISOString()

    const result = await createCashClosure({
      cashDate: isoDate,
      value: numValue,
      observation: observation || undefined,
      userId: selectedUserId || undefined,
    })

    if (result.success) {
      toast.success('Caixa enviado com sucesso!')
      setCashDate('')
      setValue('')
      setObservation('')
      setSelectedUserId('')
      router.refresh()
      onClose()
    } else {
      toast.error(result.message)
    }

    setIsSubmitting(false)
  }

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Lançar Fechamento de Caixa</DialogTitle>
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
            <p className="text-on-surface-variant text-xs">
              Só é permitido enviar caixas de dias anteriores.
            </p>
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

          {users && users.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Colaborador (Opcional)
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="bg-surface text-on-surface border-surface-container w-full rounded-md border px-3 py-2 text-sm"
              >
                <option value="">Selecione o colaborador...</option>
                {users
                  .filter((u) => u.role !== 'ADMIN' && u.role !== 'MANAGER')
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
              </select>
            </div>
          )}

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
              {isSubmitting ? 'Enviando...' : 'Enviar Fechamento'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
