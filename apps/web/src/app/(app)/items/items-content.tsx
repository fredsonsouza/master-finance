'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { Item, ItemPagination } from '@/http/get-items'
import type { Sector } from '@/http/get-sectors'
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
  Search,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { fetchItemsAction } from './actions'
import { UpdateItemDialog } from './update-item-dialog'

interface Props {
  initialItems: Item[]
  initialPagination: ItemPagination
  sectors: Sector[]
  canManage: boolean
}

export function ItemsContent({
  initialItems,
  initialPagination,
  sectors,
  canManage,
}: Props) {
  const [items, setItems] = useState<Item[]>(initialItems)
  const [pagination, setPagination] = useState<ItemPagination>(initialPagination)

  const [searchInput, setSearchInput] = useState('')
  const [activeSearch, setActiveSearch] = useState('')
  const [selectedSectorId, setSelectedSectorId] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function loadPage(
    page: number,
    search = activeSearch,
    sectorId = selectedSectorId
  ) {
    setIsLoading(true)
    const res = await fetchItemsAction({
      page,
      perPage: pagination.perPage || 20,
      search: search || undefined,
      sectorId: sectorId || undefined,
    })

    if (res.success && res.data) {
      setItems(res.data.items)
      setPagination(res.data.pagination)
    } else {
      toast.error(res.message || 'Erro ao carregar itens do catálogo.')
    }
    setIsLoading(false)
  }

  async function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    setActiveSearch(searchInput.trim())
    await loadPage(1, searchInput.trim(), selectedSectorId)
  }

  async function handleSectorChange(sectorId: string) {
    setSelectedSectorId(sectorId)
    await loadPage(1, activeSearch, sectorId)
  }

  async function handleClearFilters() {
    setSearchInput('')
    setActiveSearch('')
    setSelectedSectorId('')
    await loadPage(1, '', '')
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters Control Bar */}
      <Card className="border-surface-container bg-surface shadow-sm">
        <CardContent className="p-4">
          <form
            onSubmit={handleSearchSubmit}
            className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4"
          >
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
              <Input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Buscar por nome do item ou descrição..."
                className="pl-9 h-10 text-sm bg-surface-container-lowest focus:ring-primary"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Sector Filter Dropdown */}
            <div className="flex items-center gap-2 shrink-0">
              <Filter className="h-4 w-4 text-primary hidden sm:block" />
              <select
                value={selectedSectorId}
                onChange={(e) => handleSectorChange(e.target.value)}
                className="h-10 rounded-md border border-outline bg-surface text-on-surface px-3 text-xs font-medium focus:ring-1 focus:ring-primary cursor-pointer w-full md:w-56"
              >
                <option value="">Todos os Setores</option>
                {sectors.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Button
                type="submit"
                disabled={isLoading}
                className="h-10 text-xs font-semibold px-4 cursor-pointer gap-1.5"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                Buscar
              </Button>

              {(activeSearch || selectedSectorId || searchInput) && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClearFilters}
                  disabled={isLoading}
                  className="h-10 text-xs font-medium px-3 cursor-pointer gap-1 text-on-surface-variant hover:text-on-surface"
                >
                  Limpar
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Main Items Table */}
      <Card className="border-surface-container shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3">
          <CardTitle className="text-lg font-bold text-primary">
            Itens Cadastrados
          </CardTitle>

          {pagination.totalCount > 0 && (
            <div className="text-xs text-on-surface-variant font-medium">
              Exibindo <span className="font-bold text-on-surface">{items.length}</span> de{' '}
              <span className="font-bold text-on-surface">{pagination.totalCount}</span> itens
            </div>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-on-surface-variant gap-2 text-sm">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              Carregando catálogo de itens...
            </div>
          ) : items.length === 0 ? (
            <div className="text-on-surface-variant py-10 text-center text-sm space-y-2">
              <p>Nenhum item encontrado no catálogo com os filtros aplicados.</p>
              {(activeSearch || selectedSectorId) && (
                <Button
                  variant="ghost"
                  onClick={handleClearFilters}
                  className="text-xs text-primary underline cursor-pointer"
                >
                  Limpar filtros de pesquisa
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-surface-container-highest text-on-surface text-xs uppercase">
                    <tr>
                      <th className="px-6 py-3 font-semibold">Nome</th>
                      <th className="px-6 py-3 font-semibold">Descrição</th>
                      <th className="px-6 py-3 font-semibold">Setor</th>
                      <th className="px-6 py-3 text-right font-semibold">
                        Qtd. Inicial
                      </th>
                      <th className="px-6 py-3 text-right font-semibold">
                        Data de Cadastro
                      </th>
                      {canManage && (
                        <th className="px-6 py-3 text-right font-semibold">
                          Ações
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-surface-container divide-y">
                    {items.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-surface-container-lowest transition-colors"
                      >
                        <td className="px-6 py-4 font-medium">{item.name}</td>
                        <td className="text-on-surface-variant px-6 py-4">
                          {item.description || '-'}
                        </td>
                        <td className="px-6 py-4">
                          {item.sector?.name ? (
                            <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                              {item.sector.name}
                            </span>
                          ) : (
                            <span className="text-on-surface-variant text-xs italic">
                              Sem Setor
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right font-semibold">
                          {item.quantity}
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap text-xs text-on-surface-variant">
                          {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                        </td>
                        {canManage && (
                          <td className="px-6 py-4 text-right">
                            <UpdateItemDialog item={item} sectors={sectors} />
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* PAGINATION CONTROLS (20 items per page) */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-outline/20 text-xs">
                  <div className="text-on-surface-variant font-medium">
                    Página <span className="font-bold text-on-surface">{pagination.page}</span> de{' '}
                    <span className="font-bold text-on-surface">{pagination.totalPages}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page <= 1 || isLoading}
                      onClick={() => loadPage(pagination.page - 1)}
                      className="h-8 gap-1 text-xs cursor-pointer"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page >= pagination.totalPages || isLoading}
                      onClick={() => loadPage(pagination.page + 1)}
                      className="h-8 gap-1 text-xs cursor-pointer"
                    >
                      Próxima
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
