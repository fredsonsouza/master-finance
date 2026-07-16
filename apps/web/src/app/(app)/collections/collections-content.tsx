'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useState } from 'react'

import type { Collection } from '@/http/collections'
import type { Unit } from '@/http/get-units'
import type { User } from '@/http/get-users'
import dayjs from 'dayjs'
import { deleteCollection } from './actions'
import { CreateCollectionDialog } from './create-collection-dialog'
import { UpdateCollectionDialog } from './update-collection-dialog'

interface Props {
  initialData: Collection[]
  activeUnitId: string | null
  collectors: User[]
  units: Unit[]
  currentUserRole: string
}

export function CollectionsContent({
  initialData,
  activeUnitId,
  collectors,
  units,
  currentUserRole,
}: Props) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedCollection, setSelectedCollection] =
    useState<Collection | null>(null)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const filtered = initialData.filter(
    (item) =>
      item.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.patientCode.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este registro?')) return
    setIsDeleting(id)
    await deleteCollection(id)
    setIsDeleting(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
          <Input
            placeholder="Buscar por paciente ou código..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {currentUserRole !== 'COLLECTOR' && (
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="gap-2 bg-primary text-on-primary hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Registrar Recoleta
          </Button>
        )}
      </div>

      <div className="rounded-xl border border-surface-container bg-surface overflow-x-auto shadow-sm">
        <table className="w-full text-left text-sm border-collapse min-width: 800px">
          <thead className="bg-surface-container-lowest text-on-surface-variant font-medium">
            <tr className="border-b border-surface-container">
              <th className="p-4 font-medium">Data Solicitada</th>
              <th className="p-4 font-medium">Cód. Atendimento</th>
              <th className="p-4 font-medium">Paciente</th>
              <th className="p-4 font-medium">Exames</th>
              <th className="p-4 font-medium">Coletador</th>
              <th className="p-4 font-medium">Motivo</th>
              <th className="p-4 font-medium">Pendência / Avisado</th>
              {currentUserRole !== 'COLLECTOR' && (
                <th className="p-4  width: 100px"></th>
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="text-center py-8 text-on-surface-variant border-b border-surface-container"
                >
                  Nenhuma recoleta encontrada.
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-surface-container hover:bg-surface-container-lowest transition-colors"
                >
                  <td className="p-4 font-medium text-on-surface whitespace-nowrap">
                    {dayjs(item.requestDate).format('DD/MM/YYYY')}
                  </td>
                  <td className="p-4">{item.patientCode}</td>
                  <td className="p-4 whitespace-nowrap">{item.patientName}</td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1  min-width: 120px">
                      {item.exams.map((exam, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center rounded-md bg-secondary-container px-2 py-1 text-xs font-medium text-on-secondary-container ring-1 ring-inset ring-secondary/20"
                        >
                          {exam}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-4 whitespace-nowrap">
                    {item.collector?.name || '-'}
                  </td>
                  <td className="p-4">
                    <div
                      className=" max-width: 200px text-sm text-on-surface-variant leading-tight"
                      title={item.reason}
                    >
                      {item.reason}
                    </div>
                  </td>
                  <td className="p-4 whitespace-nowrap">
                    <div className="text-xs text-on-surface-variant flex flex-col gap-0.5">
                      <div>
                        <span className="font-semibold">P:</span>{' '}
                        {item.pendingBy || '-'}
                      </div>
                      <div>
                        <span className="font-semibold">A:</span>{' '}
                        {item.notifiedBy || '-'}
                      </div>
                    </div>
                  </td>
                  {currentUserRole !== 'COLLECTOR' && (
                    <td className="p-4 text-right whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-on-surface-variant hover:text-primary hover:bg-surface-container-highest mr-1"
                        onClick={() => {
                          setSelectedCollection(item)
                          setIsEditOpen(true)
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-error hover:text-error hover:bg-error-container"
                        onClick={() => handleDelete(item.id)}
                        disabled={isDeleting === item.id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <CreateCollectionDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        collectors={collectors}
        units={units}
        activeUnitId={activeUnitId}
      />

      {selectedCollection && (
        <UpdateCollectionDialog
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          collection={selectedCollection}
          collectors={collectors}
          units={units}
        />
      )}
    </div>
  )
}
