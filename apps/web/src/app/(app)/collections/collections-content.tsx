'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  ChevronDown,
  ChevronUp,
  FileDown,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import type { Collection } from '@/http/collections'
import type { Unit } from '@/http/get-units'
import type { User } from '@/http/get-users'
import dayjs from 'dayjs'
import { deleteCollection } from './actions'
import { CreateCollectionDialog } from './create-collection-dialog'
import { downloadCollectionsPdf } from './download-collections-pdf'
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
  const [unitFilter, setUnitFilter] = useState<string>('ALL')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedCollection, setSelectedCollection] =
    useState<Collection | null>(null)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [isExportingPdf, setIsExportingPdf] = useState(false)
  const [expandedExams, setExpandedExams] = useState<Record<string, boolean>>(
    {}
  )

  const toggleExams = (id: string) => {
    setExpandedExams((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const filtered = initialData.filter((item) => {
    const matchesSearch =
      item.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.patientCode.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesUnit = unitFilter === 'ALL' || item.unit?.id === unitFilter
    return matchesSearch && matchesUnit
  })

  const handleExportPdf = async () => {
    if (filtered.length === 0) {
      toast.error('Nenhum registro encontrado para exportar.')
      return
    }

    setIsExportingPdf(true)
    try {
      const selectedUnitObj =
        unitFilter !== 'ALL'
          ? units.find((u) => u.id === unitFilter)
          : undefined

      await downloadCollectionsPdf({
        collections: filtered,
        filters: {
          unitName: selectedUnitObj
            ? selectedUnitObj.name
            : 'Todas as Unidades',
          search: searchQuery.trim() || undefined,
        },
      })

      toast.success('Relatório em PDF gerado e baixado com sucesso!')
    } catch {
      toast.error('Erro ao gerar relatório em PDF.')
    } finally {
      setIsExportingPdf(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este registro?')) return
    setIsDeleting(id)
    await deleteCollection(id)
    setIsDeleting(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center flex-1 gap-4">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
            <Input
              placeholder="Buscar por paciente ou código..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {units.length > 0 && (
            <select
              value={unitFilter}
              onChange={(e) => setUnitFilter(e.target.value)}
              className="flex h-10 rounded-md border border-input bg-surface px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="ALL">Todas as unidades</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            disabled={isExportingPdf || filtered.length === 0}
            onClick={handleExportPdf}
            className="gap-2 cursor-pointer"
          >
            {isExportingPdf ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4" />
            )}
            Exportar PDF
          </Button>

          {currentUserRole !== 'COLLECTOR' && (
            <Button
              onClick={() => setIsCreateOpen(true)}
              className="gap-2 bg-primary text-on-primary hover:bg-primary/90 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Registrar Recoleta
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-surface-container bg-surface overflow-x-auto shadow-sm">
        <table className="w-full text-left text-sm border-collapse min-width: 800px">
          <thead className="bg-surface-container-lowest text-on-surface-variant font-medium">
            <tr className="border-b border-surface-container">
              <th className="p-4 font-medium">Data Solicitada</th>
              <th className="p-4 font-medium">Cód. Atendimento</th>
              <th className="p-4 font-medium">Paciente</th>
              <th className="p-4 font-medium">Unidade</th>
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
                  colSpan={9}
                  className="text-center py-8 text-on-surface-variant border-b border-surface-container"
                >
                  Nenhuma recoleta encontrada.
                </td>
              </tr>
            ) : (
              filtered.map((item) => {
                const hasMoreThanTwoExams = item.exams.length > 2
                const isExpanded = !!expandedExams[item.id]
                const visibleExams =
                  hasMoreThanTwoExams && !isExpanded
                    ? item.exams.slice(0, 2)
                    : item.exams
                const hiddenExamsCount = item.exams.length - 2

                return (
                  <tr
                    key={item.id}
                    className="border-b border-surface-container hover:bg-surface-container-lowest transition-colors"
                  >
                    <td className="p-4 font-medium text-on-surface whitespace-nowrap">
                      {dayjs(item.requestDate).format('DD/MM/YYYY')}
                    </td>
                    <td className="p-4">{item.patientCode}</td>
                    <td className="p-4 whitespace-nowrap">
                      {item.patientName}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      {item.unit?.name || '-'}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap items-center gap-1.5 min-w-[160px] max-w-[300px]">
                        {visibleExams.map((exam, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center rounded-md bg-secondary-container px-2 py-1 text-xs font-medium text-on-secondary-container ring-1 ring-inset ring-secondary/20"
                          >
                            {exam}
                          </span>
                        ))}

                        {hasMoreThanTwoExams && (
                          <button
                            type="button"
                            onClick={() => toggleExams(item.id)}
                            aria-expanded={isExpanded}
                            title={
                              isExpanded
                                ? 'Recolher exames'
                                : `Clique para expandir: ${item.exams.slice(2).join(', ')}`
                            }
                            className="inline-flex items-center gap-1 rounded-md bg-primary/10 hover:bg-primary/20 px-2 py-1 text-xs font-semibold text-primary ring-1 ring-inset ring-primary/25 transition-colors cursor-pointer"
                          >
                            {isExpanded ? (
                              <>
                                Recolher
                                <ChevronUp className="h-3 w-3" />
                              </>
                            ) : (
                              <>
                                +{hiddenExamsCount} mais
                                <ChevronDown className="h-3 w-3" />
                              </>
                            )}
                          </button>
                        )}
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
                )
              })
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
