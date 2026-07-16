'use client'

import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { Input } from '@/components/ui/input'
import type { AuditLog } from '@/http/get-logs'
import dayjs from 'dayjs'
import { Printer, RotateCcw, Search } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useRef, useState, useTransition } from 'react'
import { useReactToPrint } from 'react-to-print'

interface LogsContentProps {
  initialLogs: AuditLog[]
}

export function LogsContent({ initialLogs }: LogsContentProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const printRef = useRef<HTMLDivElement>(null)

  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')
  const activeResource = searchParams.get('resource') || ''
  const activeAction = searchParams.get('action') || ''
  const startDate = searchParams.get('startDate') || ''
  const endDate = searchParams.get('endDate') || ''

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Relatorio_Logs_${dayjs().format('YYYY-MM-DD_HHmm')}`,
  })

  const applyFilters = (filters: {
    resource?: string
    action?: string
    search?: string
    startDate?: string
    endDate?: string
  }) => {
    const params = new URLSearchParams(searchParams.toString())

    if (filters.resource !== undefined) {
      if (filters.resource) params.set('resource', filters.resource)
      else params.delete('resource')
    }

    if (filters.action !== undefined) {
      if (filters.action) params.set('action', filters.action)
      else params.delete('action')
    }

    if (filters.search !== undefined) {
      if (filters.search) params.set('search', filters.search)
      else params.delete('search')
    }

    if (filters.startDate !== undefined) {
      if (filters.startDate) params.set('startDate', filters.startDate)
      else params.delete('startDate')
    }

    if (filters.endDate !== undefined) {
      if (filters.endDate) params.set('endDate', filters.endDate)
      else params.delete('endDate')
    }

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    applyFilters({ search: searchTerm })
  }

  const clearFilters = () => {
    setSearchTerm('')
    startTransition(() => {
      router.push(pathname)
    })
  }

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
      case 'UPDATE':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
      case 'DELETE':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
      default:
        return 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20'
    }
  }

  const getActionName = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'Criação'
      case 'UPDATE':
        return 'Edição'
      case 'DELETE':
        return 'Exclusão'
      default:
        return action
    }
  }

  const getResourceName = (resource: string) => {
    switch (resource) {
      case 'USER':
        return 'Usuário'
      case 'UNIT':
        return 'Unidade'
      case 'SECTOR':
        return 'Setor'
      case 'ITEM':
        return 'Item/Procedimento'
      case 'TRANSACTION':
        return 'Movimentação'
      case 'CASH_CLOSURE':
        return 'Fechamento de Caixa'
      case 'COLLECTION':
        return 'Recoleta'
      case 'AUTH':
        return 'Autenticação'
      default:
        return resource
    }
  }

  const getFiltersDescription = () => {
    const parts = []
    if (activeResource)
      parts.push(`Recurso: ${getResourceName(activeResource)}`)
    if (activeAction) parts.push(`Ação: ${getActionName(activeAction)}`)
    if (searchTerm) parts.push(`Pesquisa: "${searchTerm}"`)
    if (startDate && endDate) {
      parts.push(
        `Período: ${dayjs(startDate).format('DD/MM/YYYY')} até ${dayjs(endDate).format('DD/MM/YYYY')}`
      )
    } else if (startDate) {
      parts.push(`A partir de: ${dayjs(startDate).format('DD/MM/YYYY')}`)
    } else if (endDate) {
      parts.push(`Até: ${dayjs(endDate).format('DD/MM/YYYY')}`)
    }
    return parts.length > 0
      ? parts.join(' | ')
      : 'Nenhum filtro aplicado (Todos)'
  }

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <p className="text-sm text-on-surface-variant">
          Exibindo {initialLogs.length} logs de auditoria
        </p>
        <Button
          onClick={() => handlePrint()}
          className="gap-2 cursor-pointer"
          type="button"
          disabled={initialLogs.length === 0}
        >
          <Printer className="h-4 w-4" />
          Exportar PDF
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-4 rounded-xl border border-surface-container bg-surface-container-low p-5 print:hidden">
        <form onSubmit={handleSearchSubmit} className="flex flex-col gap-4">
          {/* Busca Textual */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
            <Input
              type="text"
              placeholder="Buscar por detalhes, usuário..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 w-full"
            />
          </div>

          {/* Filtros de Categoria & Datas */}
          <div className="flex flex-wrap items-center gap-4">
            <select
              value={activeResource}
              onChange={(e) => applyFilters({ resource: e.target.value })}
              className="h-10 rounded-md border border-surface-container bg-surface-container-lowest px-3 py-1 text-sm outline-none focus:border-primary min-w-[160px] text-on-surface"
            >
              <option value="">Todos os Recursos</option>
              <option value="USER">Usuários</option>
              <option value="UNIT">Unidades</option>
              <option value="SECTOR">Setores</option>
              <option value="ITEM">Procedimentos/Itens</option>
              <option value="TRANSACTION">Movimentações</option>
              <option value="CASH_CLOSURE">Fechamento de Caixa</option>
              <option value="COLLECTION">Recoletas</option>
              <option value="AUTH">Autenticação</option>
            </select>

            <select
              value={activeAction}
              onChange={(e) => applyFilters({ action: e.target.value })}
              className="h-10 rounded-md border border-surface-container bg-surface-container-lowest px-3 py-1 text-sm outline-none focus:border-primary min-w-[140px] text-on-surface"
            >
              <option value="">Todas as Ações</option>
              <option value="CREATE">Criação</option>
              <option value="UPDATE">Edição</option>
              <option value="DELETE">Exclusão</option>
            </select>

            <div className="h-6 w-px bg-surface-container hidden md:block" />

            <div className="flex items-center gap-2">
              <span className="text-xs text-on-surface-variant font-medium">
                De:
              </span>
              <DatePicker
                value={startDate}
                onChange={(val) => applyFilters({ startDate: val })}
                outputFormat="YYYY-MM-DD"
                className="w-36"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-on-surface-variant font-medium">
                Até:
              </span>
              <DatePicker
                value={endDate}
                onChange={(val) => applyFilters({ endDate: val })}
                outputFormat="YYYY-MM-DD"
                className="w-36"
              />
            </div>

            {(searchTerm ||
              activeResource ||
              activeAction ||
              startDate ||
              endDate) && (
              <Button
                type="button"
                variant="outline"
                onClick={clearFilters}
                className="h-10 gap-2 ml-auto"
              >
                <RotateCcw className="h-4 w-4" />
                Limpar
              </Button>
            )}
          </div>
        </form>
      </div>

      {/* Printable Wrapper */}
      <div ref={printRef} className="print:p-8 print:bg-white print:text-black">
        {/* Header visible ONLY in PDF print */}
        <div className="hidden print:block border-b-2 border-zinc-200 pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-zinc-950">Master Admin</h1>
              <h2 className="text-base font-semibold text-zinc-700 mt-0.5">
                Relatório de Logs de Auditoria
              </h2>
            </div>
            <div className="text-right text-xs text-zinc-500 font-mono">
              <p>Gerado em: {dayjs().format('DD/MM/YYYY HH:mm')}</p>
              <p>Registros: {initialLogs.length}</p>
            </div>
          </div>
          <div className="mt-3 bg-zinc-50 p-2 rounded border border-zinc-200 text-2xs text-zinc-700">
            <span className="font-semibold">Filtros ativos:</span>{' '}
            {getFiltersDescription()}
          </div>
        </div>

        {/* Tabela de Logs */}
        <div className="rounded-xl border border-surface-container bg-surface-container-lowest overflow-hidden print:border-none print:shadow-none">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm print:text-[10px] print:leading-tight">
              <thead>
                <tr className="border-b border-surface-container bg-surface-container-low text-on-surface-variant font-medium print:bg-zinc-100 print:text-zinc-800 print:border-zinc-300">
                  <th className="p-4 w-[160px] print:p-2">Data / Hora</th>
                  <th className="p-4 w-[100px] print:p-2">Ação</th>
                  <th className="p-4 w-[140px] print:p-2">Usuário</th>
                  <th className="p-4 w-[150px] print:p-2">Recurso</th>
                  <th className="p-4 print:p-2">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container text-on-surface print:divide-zinc-200">
                {isPending ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-8 text-center text-on-surface-variant"
                    >
                      Atualizando logs...
                    </td>
                  </tr>
                ) : initialLogs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-8 text-center text-on-surface-variant"
                    >
                      Nenhum log de auditoria encontrado com os filtros
                      selecionados.
                    </td>
                  </tr>
                ) : (
                  initialLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-surface-container-lowest/50 transition-colors print:hover:bg-transparent print:bg-white"
                    >
                      <td className="p-4 whitespace-nowrap text-on-surface-variant font-mono text-xs print:p-2 print:text-zinc-600">
                        {dayjs(log.createdAt).format('DD/MM/YYYY HH:mm:ss')}
                      </td>
                      <td className="p-4 print:p-2">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${getActionBadgeColor(log.action)} print:bg-transparent print:border print:border-zinc-300 print:text-zinc-800`}
                        >
                          {getActionName(log.action)}
                        </span>
                      </td>
                      <td className="p-4 font-medium print:p-2 print:text-zinc-950">
                        {log.user.name}
                        <span className="block text-xs font-normal text-on-surface-variant print:text-zinc-500">
                          @{log.user.username}
                        </span>
                      </td>
                      <td className="p-4 font-medium text-xs print:p-2 print:text-zinc-950">
                        <span className="inline-flex items-center rounded bg-surface-container px-2 py-1 text-on-surface print:bg-zinc-100 print:border print:border-zinc-200 print:text-zinc-800">
                          {getResourceName(log.resource)}
                        </span>
                      </td>
                      <td className="p-4 text-xs max-w-md break-words font-sans text-on-surface font-medium leading-relaxed print:p-2 print:text-zinc-950 print:max-w-none">
                        {log.details}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
