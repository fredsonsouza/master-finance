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
import type { Collection } from '@/http/collections'
import type { Unit } from '@/http/get-units'
import type { User } from '@/http/get-users'
import dayjs from 'dayjs'
import { Plus, X } from 'lucide-react'
import { updateCollection } from './actions'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  collection: Collection
  collectors: User[]
  units?: Unit[]
}

export function UpdateCollectionDialog({
  open,
  onOpenChange,
  collection,
  collectors,
  units,
}: Props) {
  const [exams, setExams] = useState<string[]>([])
  const [currentExam, setCurrentExam] = useState('')
  const [requestDate, setRequestDate] = useState('')
  const [reason, setReason] = useState('')
  const [patientCode, setPatientCode] = useState('')
  const [patientName, setPatientName] = useState('')
  const [pendingBy, setPendingBy] = useState('')
  const [notifiedBy, setNotifiedBy] = useState('')
  const [selectedCollectorId, setSelectedCollectorId] = useState('')

  useEffect(() => {
    if (open && collection) {
      setExams(collection.exams || [])
      const date = dayjs(collection.requestDate)
      setRequestDate(date.isValid() ? date.format('DD/MM/YYYY') : '')
      setReason(collection.reason || '')
      setPatientCode(collection.patientCode || '')
      setPatientName(collection.patientName || '')
      setPendingBy(collection.pendingBy || '')
      setNotifiedBy(collection.notifiedBy || '')
      setSelectedCollectorId(collection.collector?.id || '')
    }
  }, [open, collection])

  const [{ success, message }, formAction, isPending] = useActionState(
    async (
      prevState: { success: boolean; message?: string },
      formData: FormData
    ) => {
      const patientCodeVal = formData.get('patientCode') as string
      const patientNameVal = formData.get('patientName') as string
      const collectorIdVal = formData.get('collectorId') as string
      const pendingByVal = formData.get('pendingBy') as string
      const notifiedByVal = formData.get('notifiedBy') as string

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

      const res = await updateCollection(collection.id, {
        requestDate: isoDate,
        patientCode: patientCodeVal,
        patientName: patientNameVal,
        exams,
        reason,
        collectorId: collectorIdVal,
        pendingBy: pendingByVal,
        notifiedBy: notifiedByVal,
      })

      if (res.success) {
        onOpenChange(false)
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
          <DialogTitle>Editar Recoleta</DialogTitle>
          <DialogDescription>
            Atualize os dados do paciente, os mnemônicos dos exames e as
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
              <Input
                name="patientCode"
                required
                placeholder="Ex: 123456"
                value={patientCode}
                onChange={(e) => setPatientCode(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Nome do Paciente</Label>
            <Input
              name="patientName"
              required
              placeholder="Nome completo"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
            />
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
              onChange={(e) => setSelectedCollectorId(e.target.value)}
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Colocado pendência por</Label>
              <Input
                name="pendingBy"
                required
                placeholder="Nome do funcionário"
                value={pendingBy}
                onChange={(e) => setPendingBy(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Avisado por</Label>
              <Input
                name="notifiedBy"
                required
                placeholder="Nome de quem avisou"
                value={notifiedBy}
                onChange={(e) => setNotifiedBy(e.target.value)}
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
              {isPending ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
