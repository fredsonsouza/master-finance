'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useActionState, useEffect, useState } from 'react'

import { DatePicker } from '@/components/ui/date-picker'
import type { Unit } from '@/http/get-units'
import type { User } from '@/http/get-users'
import { Plus, X } from 'lucide-react'
import { createCollection } from './actions'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  collectors: User[]
  units?: Unit[]
  activeUnitId?: string | null
}

export function CreateCollectionDialog({
  open,
  onOpenChange,
  collectors,
  units,
  activeUnitId,
}: Props) {
  const [exams, setExams] = useState<string[]>([])
  const [currentExam, setCurrentExam] = useState('')
  const [requestDate, setRequestDate] = useState('')
  const [reason, setReason] = useState('')

  const [selectedCollectorId, setSelectedCollectorId] = useState('')
  const [selectedUnitId, setSelectedUnitId] = useState(activeUnitId || '')

  useEffect(() => {
    if (open) {
      setSelectedCollectorId('')
      setSelectedUnitId(activeUnitId || '')
    }
  }, [open, activeUnitId])

  const [{ success, message }, formAction, isPending] = useActionState(
    async (
      prevState: { success: boolean; message?: string },
      formData: FormData
    ) => {
      const patientCode = formData.get('patientCode') as string
      const patientName = formData.get('patientName') as string
      const collectorId = formData.get('collectorId') as string
      const pendingBy = formData.get('pendingBy') as string
      const notifiedBy = formData.get('notifiedBy') as string

      if (exams.length === 0) {
        return {
          success: false,
          message: 'Adicione pelo menos um mnemônico de exame.',
        }
      }

      if (!requestDate) {
        return { success: false, message: 'Data solicitada é obrigatória.' }
      }

      const [dd, mm, yyyy] = requestDate.split('/')
      if (!dd || !mm || !yyyy || yyyy.includes('_')) {
        return { success: false, message: 'Data inválida.' }
      }
      const isoDate = `${yyyy}-${mm}-${dd}T12:00:00.000Z`

      const res = await createCollection({
        requestDate: isoDate,
        patientCode,
        patientName,
        exams,
        reason,
        collectorId,
        pendingBy,
        notifiedBy,
        unitId: selectedUnitId || undefined,
      })

      if (res.success) {
        onOpenChange(false)
        setExams([])
        setRequestDate('')
        setReason('')
      }
      return res
    },
    { success: false, message: undefined }
  )

  const handleAddExam = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addExam()
    }
  }

  const addExam = () => {
    const val = currentExam.trim().toUpperCase()
    if (val && !exams.includes(val)) {
      setExams([...exams, val])
      setCurrentExam('')
    }
  }

  const removeExam = (exam: string) => {
    setExams(exams.filter((e) => e !== exam))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Nova Recoleta</DialogTitle>
          <DialogDescription>
            Insira os dados do paciente, os mnemônicos dos exames e as
            pendências.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-5 mt-2">
          {message && !success && (
            <div className="bg-error-container text-on-error-container p-3 rounded-md text-sm font-medium">
              {message}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data Solicitada</Label>
              <DatePicker
                value={requestDate}
                onChange={setRequestDate}
                outputFormat="DD/MM/YYYY"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Código do Atendimento</Label>
              <Input name="patientCode" required placeholder="Ex: 123456" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Nome do Paciente</Label>
            <Input name="patientName" required placeholder="Nome completo" />
          </div>

          <div className="space-y-2">
            <Label>Exames (Mnemônicos)</Label>
            <div className="flex gap-2">
              <Input
                value={currentExam}
                onChange={(e) => setCurrentExam(e.target.value)}
                onKeyDown={handleAddExam}
                placeholder="Ex: HEMO, GLIC, URI (Pressione Enter)"
                className="flex-1"
              />
              <Button
                type="button"
                onClick={addExam}
                variant="secondary"
                className="px-3"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {exams.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2 p-3 bg-surface-container-lowest rounded-md border border-surface-container">
                {exams.map((exam) => (
                  <span
                    key={exam}
                    className="inline-flex items-center gap-1 rounded-md bg-primary-container px-2 py-1 text-xs font-medium text-on-primary-container"
                  >
                    {exam}
                    <button
                      type="button"
                      onClick={() => removeExam(exam)}
                      className="text-on-primary-container hover:text-error transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <Label>Motivo da Recoleta</Label>
              <span
                className={`text-xs ${reason.length >= 120 ? 'text-error font-bold' : 'text-on-surface-variant'}`}
              >
                {reason.length}/120
              </span>
            </div>
            <textarea
              name="reason"
              required
              maxLength={120}
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Descreva o motivo (máximo 120 caracteres)"
              className="flex w-full min-h-[80px] rounded-md border border-outline bg-surface px-3 py-2 text-sm shadow-sm placeholder:text-on-surface-variant focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label>Coletador</Label>
            <select
              name="collectorId"
              required
              value={selectedCollectorId}
              onChange={(e) => {
                const val = e.target.value
                setSelectedCollectorId(val)
                const selectedCollector = collectors.find((c) => c.id === val)
                if (selectedCollector?.unitId) {
                  setSelectedUnitId(selectedCollector.unitId)
                }
              }}
              className="w-full border border-outline bg-surface rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:outline-none cursor-pointer"
            >
              <option value="">Selecione um Coletador</option>
              {collectors.map((c) => {
                const cUnit = units?.find((u) => u.id === c.unitId)
                return (
                  <option key={c.id} value={c.id}>
                    {c.name} {cUnit ? `(${cUnit.name})` : ''}
                  </option>
                )
              })}
            </select>
          </div>

          {units && units.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="dialog-unit-id">Unidade</Label>
              <select
                id="dialog-unit-id"
                name="unitId"
                required
                value={selectedUnitId}
                onChange={(e) => setSelectedUnitId(e.target.value)}
                className="w-full border border-outline bg-surface rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary focus:outline-none cursor-pointer"
              >
                <option value="">Selecione uma Unidade</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Colocado pendência por</Label>
              <Input
                name="pendingBy"
                required
                placeholder="Nome do funcionário"
              />
            </div>
            <div className="space-y-2">
              <Label>Avisado por</Label>
              <Input
                name="notifiedBy"
                required
                placeholder="Nome de quem avisou"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Salvando...' : 'Registrar Recoleta'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
