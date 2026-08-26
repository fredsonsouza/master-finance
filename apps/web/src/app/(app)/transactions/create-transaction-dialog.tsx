'use client'

import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Item } from '@/http/get-items'
import type { Sector } from '@/http/get-sectors'
import type { Unit } from '@/http/get-units'
import {
  DollarSign,
  Edit2,
  Info,
  Loader2,
  Plus,
  Search,
  Tag,
  Trash2,
} from 'lucide-react'
import { useActionState, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  createTransactionAction,
  fetchAllItemsAction,
  getItemMetricsAction,
} from './actions'

interface Props {
  items: Item[]
  sectors: Sector[]
  units: Unit[]
  activeUnitId?: string | null
}

interface AddedItem {
  itemId: string
  name: string
  categoryName?: string | null
  quantity: number
  unitValue: number
}

export function CreateTransactionDialog({
  items,
  sectors,
  units,
  activeUnitId,
}: Props) {
  const [open, setOpen] = useState(false)
  const [dateInput, setDateInput] = useState('')
  const [type, setType] = useState<'ENTRY' | 'EXIT'>('ENTRY')
  const [selectedUnitId, setSelectedUnitId] = useState('')
  const [selectedSectorId, setSelectedSectorId] = useState('')

  // Full catalog items (initialized from props, refreshed on dialog open)
  const [catalogItems, setCatalogItems] = useState<Item[]>(items || [])

  // Sync props changes
  useEffect(() => {
    if (items && items.length > 0) {
      setCatalogItems(items)
    }
  }, [items])

  // Refresh full catalog dynamically whenever dialog is opened
  useEffect(() => {
    if (open) {
      fetchAllItemsAction().then((res) => {
        if (res.success && res.items && res.items.length > 0) {
          setCatalogItems(res.items)
        }
      })
    }
  }, [open])

  // Selected items list
  const [addedItems, setAddedItems] = useState<AddedItem[]>([])

  // Search/Autocomplete states
  const [showItemDropdown, setShowItemDropdown] = useState(false)
  const [itemSearchQuery, setItemSearchQuery] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Sub-modal states
  const [subModalOpen, setSubModalOpen] = useState(false)
  const [subModalItem, setSubModalItem] = useState<Item | null>(null)
  const [subQuantity, setSubQuantity] = useState('1')
  const [subUnitValueMask, setSubUnitValueMask] = useState('')
  const [subStock, setSubStock] = useState<number | null>(null)
  const [checkingStock, setCheckingStock] = useState(false)
  const [stockValidationMsg, setStockValidationMsg] = useState('')

  // Set default unit on opening or when activeUnitId changes
  useEffect(() => {
    if (activeUnitId) {
      setSelectedUnitId(activeUnitId)
    } else if (units.length > 0) {
      setSelectedUnitId(units[0].id)
    }
  }, [activeUnitId, units])

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowItemDropdown(false)
        setHighlightedIndex(-1)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filter items by search query (accent-insensitive, case-insensitive, searching name, description and category)
  const filteredItems = catalogItems.filter((item) => {
    if (!itemSearchQuery.trim()) return true
    const normalize = (str: string) =>
      str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()

    const q = normalize(itemSearchQuery)
    const nameMatch = normalize(item.name).includes(q)
    const descMatch = item.description
      ? normalize(item.description).includes(q)
      : false
    const catMatch = item.category?.name
      ? normalize(item.category.name).includes(q)
      : false

    return nameMatch || descMatch || catMatch
  })

  // Adjust highlighted index on query change or dropdown toggle
  useEffect(() => {
    if (showItemDropdown && filteredItems.length > 0) {
      setHighlightedIndex(0)
    } else {
      setHighlightedIndex(-1)
    }
  }, [itemSearchQuery, showItemDropdown, filteredItems.length])

  // Auto-scroll the highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const optionButtons =
        listRef.current.querySelectorAll<HTMLButtonElement>('button')
      if (optionButtons[highlightedIndex]) {
        optionButtons[highlightedIndex].scrollIntoView({
          block: 'nearest',
          behavior: 'smooth',
        })
      }
    }
  }, [highlightedIndex])

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showItemDropdown || filteredItems.length === 0) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        setShowItemDropdown(true)
      }
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex((prev) =>
        prev < filteredItems.length - 1 ? prev + 1 : 0
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredItems.length - 1
      )
    } else if (e.key === 'Enter') {
      if (highlightedIndex >= 0 && highlightedIndex < filteredItems.length) {
        e.preventDefault()
        openConfigureItemModal(filteredItems[highlightedIndex])
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setShowItemDropdown(false)
      setHighlightedIndex(-1)
    }
  }

  const [state, formAction, isPending] = useActionState(
    async (
      prevState: { success: boolean; message: string | null },
      formData: FormData
    ) => {
      formData.set('itemsJson', JSON.stringify(addedItems))
      const result = await createTransactionAction(formData)
      if (result.success) {
        toast.success('Transações registradas com sucesso!')
        setOpen(false)
        setDateInput('')
        setAddedItems([])
        setSelectedSectorId('')
        setItemSearchQuery('')
      } else if (result.message) {
        toast.error(result.message)
      }
      return result
    },
    { success: false, message: null }
  )

  function openConfigureItemModal(item: Item, existingAddedItem?: AddedItem) {
    setSubModalItem(item)
    setStockValidationMsg('')

    if (existingAddedItem) {
      setSubQuantity(String(existingAddedItem.quantity))
      setSubUnitValueMask(
        new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(existingAddedItem.unitValue)
      )
    } else {
      setSubQuantity('1')
      const initialPrice = item.value ?? 0
      setSubUnitValueMask(
        initialPrice > 0
          ? new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }).format(initialPrice)
          : 'R$ 0,00'
      )
    }

    if (type === 'EXIT') {
      setCheckingStock(true)
      getItemMetricsAction(item.id, selectedUnitId)
        .then((metrics) => {
          if (metrics) {
            setSubStock(metrics.currentStock)
            if (!existingAddedItem && item.value === 0 && metrics.lastPrice) {
              setSubUnitValueMask(
                new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(metrics.lastPrice)
              )
            }
          } else {
            setSubStock(item.quantity)
          }
        })
        .catch(() => {
          setSubStock(item.quantity)
        })
        .finally(() => {
          setCheckingStock(false)
        })
    } else {
      setSubStock(null)
    }

    setShowItemDropdown(false)
    setHighlightedIndex(-1)
    setSubModalOpen(true)
  }

  const handleConfirmSubModal = () => {
    if (!subModalItem) return

    const qty = Number(subQuantity)
    const unitVal = Number(subUnitValueMask.replace(/\D/g, '')) / 100

    if (isNaN(qty) || qty <= 0) {
      toast.error('Informe uma quantidade válida.')
      return
    }

    if (isNaN(unitVal) || unitVal < 0) {
      toast.error('Informe um valor unitário válido.')
      return
    }

    if (type === 'EXIT' && subStock !== null && qty > subStock) {
      setStockValidationMsg(
        `Quantidade informada (${qty}) é maior que o estoque atual disponível (${subStock}).`
      )
      return
    }

    // Add or update item in list
    setAddedItems((prev) => {
      const existingIdx = prev.findIndex((i) => i.itemId === subModalItem.id)
      const newItemData: AddedItem = {
        itemId: subModalItem.id,
        name: subModalItem.name,
        categoryName: subModalItem.category?.name,
        quantity: qty,
        unitValue: unitVal,
      }

      if (existingIdx > -1) {
        const updated = [...prev]
        updated[existingIdx] = newItemData
        return updated
      }
      return [...prev, newItemData]
    })

    setSubModalOpen(false)
    setSubModalItem(null)
    setItemSearchQuery('')
  }

  const handleRemoveItem = (itemId: string) => {
    setAddedItems((prev) => prev.filter((i) => i.itemId !== itemId))
  }

  // Grand total
  const grandTotal = addedItems.reduce(
    (acc, i) => acc + i.unitValue * i.quantity,
    0
  )

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="gap-2 cursor-pointer">
            <Plus className="h-4 w-4" />
            Nova Transação
          </Button>
        </DialogTrigger>
        <DialogContent className="w-[95vw] md:w-[70vw] md:max-w-[70vw] max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-primary">
              Registrar Movimentação de Estoque
            </DialogTitle>
            <DialogDescription>
              Lance entradas ou saídas de itens no estoque por unidade e setor.
            </DialogDescription>
          </DialogHeader>

          <form action={formAction} className="space-y-6 pt-2">
            {/* Top configuration parameters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type" className="font-semibold text-xs text-on-surface">
                  Tipo de Movimentação *
                </Label>
                <select
                  id="type"
                  name="type"
                  required
                  value={type}
                  onChange={(e) => {
                    setType(e.target.value as 'ENTRY' | 'EXIT')
                    setAddedItems([])
                  }}
                  className="border-outline bg-surface text-on-surface focus-visible:border-primary focus-visible:ring-primary h-10 w-full cursor-pointer rounded-md border px-3 py-2 text-sm focus-visible:ring-1 focus-visible:outline-none"
                >
                  <option value="ENTRY">Entrada (Estoque)</option>
                  <option value="EXIT">Saída (Consumo / Setor)</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="unitId" className="font-semibold text-xs text-on-surface">
                  Unidade *
                </Label>
                <select
                  id="unitId"
                  name="unitId"
                  required
                  value={selectedUnitId}
                  onChange={(e) => {
                    setSelectedUnitId(e.target.value)
                    setAddedItems([])
                  }}
                  className="border-outline bg-surface text-on-surface focus-visible:border-primary focus-visible:ring-primary h-10 w-full cursor-pointer rounded-md border px-3 py-2 text-sm focus-visible:ring-1 focus-visible:outline-none"
                >
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sectorId" className="font-semibold text-xs text-on-surface">
                  {type === 'ENTRY' ? 'Setor Destino' : 'Setor Solicitante (Saída) *'}
                </Label>
                {type === 'ENTRY' ? (
                  <Input
                    id="sector-entry-display"
                    value="Estoque (Automático)"
                    disabled
                    className="bg-surface-container text-on-surface-variant font-medium cursor-not-allowed h-10 text-sm"
                  />
                ) : (
                  <select
                    id="sectorId"
                    name="sectorId"
                    required
                    value={selectedSectorId}
                    onChange={(e) => setSelectedSectorId(e.target.value)}
                    className="border-outline bg-surface text-on-surface focus-visible:border-primary focus-visible:ring-primary h-10 w-full cursor-pointer rounded-md border px-3 py-2 text-sm focus-visible:ring-1 focus-visible:outline-none"
                  >
                    <option value="">Selecione o setor...</option>
                    {sectors
                      .filter((s) => s.name.toLowerCase() !== 'estoque')
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                  </select>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date" className="font-semibold text-xs text-on-surface">
                  Data da Movimentação (Opcional)
                </Label>
                <DatePicker
                  id="date"
                  name="date"
                  value={dateInput}
                  onChange={setDateInput}
                  outputFormat="YYYY-MM-DD"
                />
              </div>
            </div>

            <hr className="border-surface-container" />

            {/* Autocomplete Search input */}
            <div ref={dropdownRef} className="relative space-y-2">
              <Label className="font-semibold text-xs text-on-surface flex items-center justify-between">
                <span>Adicionar Item ao Lote</span>
                <span className="text-[11px] font-normal text-on-surface-variant">
                  Selecione o item para definir quantidade e valor
                </span>
              </Label>
              <div className="relative">
                <Search className="text-on-surface-variant absolute top-3 left-3 h-4 w-4" />
                <Input
                  placeholder="Buscar item pelo nome ou código..."
                  className="bg-surface pl-10 h-10 text-sm"
                  value={itemSearchQuery}
                  onFocus={() => setShowItemDropdown(true)}
                  onChange={(e) => {
                    setItemSearchQuery(e.target.value)
                    setShowItemDropdown(true)
                  }}
                  onKeyDown={handleSearchKeyDown}
                />
              </div>

              {showItemDropdown && (
                <div
                  ref={listRef}
                  className="absolute z-20 w-full mt-1 bg-surface border border-outline rounded-md max-h-56 overflow-y-auto shadow-xl"
                >
                  {filteredItems.length === 0 ? (
                    <div className="p-4 text-sm text-on-surface-variant italic text-center">
                      Nenhum item encontrado no catálogo.
                    </div>
                  ) : (
                    filteredItems.map((item, index) => {
                      const isHighlighted = index === highlightedIndex
                      return (
                        <button
                          key={item.id}
                          type="button"
                          className={`w-full text-left p-3 text-sm cursor-pointer border-b last:border-0 border-outline/20 text-on-surface transition-colors ${
                            isHighlighted
                              ? 'bg-primary/10 text-primary font-medium'
                              : 'hover:bg-surface-container'
                          }`}
                          onMouseEnter={() => setHighlightedIndex(index)}
                          onClick={() => openConfigureItemModal(item)}
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-sm ${
                                isHighlighted ? 'font-bold' : 'font-semibold'
                              }`}
                            >
                              {item.name}
                            </span>
                            <div className="flex items-center gap-2">
                              {item.value > 0 && (
                                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                                  {new Intl.NumberFormat('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL',
                                  }).format(item.value)}
                                </span>
                              )}
                              {item.category?.name && (
                                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                                  {item.category.name}
                                </span>
                              )}
                            </div>
                          </div>
                          {item.description && (
                            <div className="text-xs text-on-surface-variant mt-0.5 line-clamp-1">
                              {item.description}
                            </div>
                          )}
                        </button>
                      )
                    })
                  )}
                </div>
              )}
            </div>

            {/* Added items table/list */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="font-semibold text-xs text-on-surface">
                  Itens Selecionados ({addedItems.length})
                </Label>
                {addedItems.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setAddedItems([])}
                    className="text-xs text-error hover:text-error/80 h-7 px-2"
                  >
                    Limpar todos
                  </Button>
                )}
              </div>

              {addedItems.length === 0 ? (
                <div className="border-2 border-dashed border-outline/50 rounded-lg p-6 text-center text-sm text-on-surface-variant bg-surface-container-lowest">
                  Nenhum item adicionado ao lote ainda. Busque e clique em um item acima para adicioná-lo.
                </div>
              ) : (
                <div className="border border-outline rounded-lg overflow-hidden divide-y divide-outline/30">
                  <div className="bg-surface-container-highest px-4 py-2 text-xs font-bold text-on-surface flex justify-between uppercase">
                    <span>Item / Categoria</span>
                    <div className="flex gap-8 text-right">
                      <span className="w-16">Qtd.</span>
                      <span className="w-24">Valor Unit.</span>
                      <span className="w-24">Subtotal</span>
                      <span className="w-14">Ações</span>
                    </div>
                  </div>

                  <div className="max-h-52 overflow-y-auto divide-y divide-outline/20">
                    {addedItems.map((item) => {
                      const catalogItem = catalogItems.find((i) => i.id === item.itemId)
                      return (
                        <div
                          key={item.itemId}
                          className="px-4 py-3 flex items-center justify-between text-sm bg-surface hover:bg-surface-container-lowest transition-colors"
                        >
                          <div className="min-w-0 pr-4">
                            <p className="font-semibold text-on-surface truncate">
                              {item.name}
                            </p>
                            {item.categoryName && (
                              <span className="inline-flex items-center text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium mt-0.5">
                                {item.categoryName}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-8 text-right shrink-0">
                            <span className="w-16 font-bold text-on-surface">
                              {item.quantity}
                            </span>
                            <span className="w-24 text-xs font-semibold text-on-surface">
                              {new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              }).format(item.unitValue)}
                            </span>
                            <span className="w-24 font-bold text-primary text-xs">
                              {new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              }).format(item.quantity * item.unitValue)}
                            </span>
                            <div className="w-14 flex items-center justify-end gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-on-surface-variant hover:text-primary cursor-pointer"
                                title="Editar Quantidade/Valor"
                                onClick={() => {
                                  if (catalogItem) {
                                    openConfigureItemModal(catalogItem, item)
                                  }
                                }}
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-error hover:text-error/80 cursor-pointer"
                                title="Remover Item"
                                onClick={() => handleRemoveItem(item.itemId)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Grand Total Summary Box */}
            {addedItems.length > 0 && (
              <div className="flex justify-between items-center p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <div>
                  <span className="text-sm font-semibold text-on-surface block">
                    Valor Total da Movimentação:
                  </span>
                  <span className="text-xs text-on-surface-variant">
                    {addedItems.length} {addedItems.length === 1 ? 'item' : 'itens'} no lote
                  </span>
                </div>
                <span className="text-xl font-bold text-primary">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  }).format(grandTotal)}
                </span>
              </div>
            )}

            {state.message && !state.success && (
              <div className="bg-error-container text-on-error-container rounded-md p-3 text-sm">
                {state.message}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isPending}
                className="cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isPending || addedItems.length === 0}
                className="cursor-pointer font-semibold px-5"
              >
                {isPending ? 'Salvando...' : 'Salvar Transações'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Sub Modal: Configure Quantity and Unit Value for Selected Item */}
      <Dialog open={subModalOpen} onOpenChange={setSubModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-primary">
              Configurar Item no Lote
            </DialogTitle>
            <DialogDescription className="font-semibold text-on-surface text-sm">
              {subModalItem?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {type === 'EXIT' && (
              <div className="p-3 bg-surface-container rounded-md text-xs space-y-1">
                {checkingStock ? (
                  <div className="flex items-center gap-2 text-on-surface-variant">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Verificando estoque disponível...
                  </div>
                ) : (
                  <p className="font-semibold text-on-surface">
                    Estoque Atual nesta unidade:{' '}
                    <span className="text-primary font-bold text-sm">
                      {subStock ?? '-'}
                    </span>
                  </p>
                )}
                {stockValidationMsg && (
                  <p className="text-error font-medium">{stockValidationMsg}</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="sub-quantity" className="font-semibold text-xs">
                Quantidade *
              </Label>
              <Input
                id="sub-quantity"
                type="number"
                min="1"
                required
                value={subQuantity}
                onChange={(e) => {
                  setSubQuantity(e.target.value)
                  setStockValidationMsg('')
                }}
                className="h-10 text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sub-value" className="font-semibold text-xs flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                  Valor Unitário (R$) *
                </span>
                <span className="text-[11px] font-normal text-on-surface-variant">
                  Editável
                </span>
              </Label>
              <Input
                id="sub-value"
                value={subUnitValueMask}
                onChange={(e) => {
                  const rawValue = e.target.value.replace(/\D/g, '')
                  const numericValue = Number(rawValue) / 100
                  setSubUnitValueMask(
                    new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(numericValue)
                  )
                }}
                placeholder="R$ 0,00"
                className="h-10 text-sm font-semibold"
              />
              <div className="flex items-start gap-1.5 p-2 rounded bg-surface-container text-xs text-on-surface-variant">
                <Info className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                <span>
                  O valor já vem preenchido com o preço cadastrado. Ao editar esse valor, o novo preço substituirá o valor base do item no catálogo para as próximas movimentações.
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSubModalOpen(false)
                setSubModalItem(null)
              }}
              className="cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleConfirmSubModal}
              className="cursor-pointer font-semibold"
            >
              Confirmar Item
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
