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
import { Plus, Trash2, Loader2, Search, Building2 } from 'lucide-react'
import { useActionState, useEffect, useState, useRef } from 'react'
import { createTransactionAction, getItemMetricsAction } from './actions'
import { toast } from 'sonner'

interface Props {
  items: Item[]
  sectors: Sector[]
  units: Unit[]
  activeUnitId?: string | null
}

interface AddedItem {
  itemId: string
  name: string
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

  // Selected items list
  const [addedItems, setAddedItems] = useState<AddedItem[]>([])

  // Search/Autocomplete states
  const [showItemDropdown, setShowItemDropdown] = useState(false)
  const [itemSearchQuery, setItemSearchQuery] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

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
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowItemDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filter items by search query
  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(itemSearchQuery.toLowerCase())
  )

  const [state, formAction, isPending] = useActionState(
    async (
      prevState: { success: boolean; message: string | null },
      formData: FormData
    ) => {
      // Append itemsJson to form data
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

  const handleConfirmSubModal = () => {
    if (!subModalItem) return

    const qty = Number(subQuantity)
    const unitVal = Number(subUnitValueMask.replace(/\D/g, '')) / 100

    if (isNaN(qty) || qty <= 0) {
      toast.error('Quantidade inválida.')
      return
    }

    if (isNaN(unitVal) || unitVal < 0) {
      toast.error('Valor unitário inválido.')
      return
    }

    if (type === 'EXIT' && subStock !== null && qty > subStock) {
      setStockValidationMsg(`Quantidade (${qty}) excede o estoque disponível (${subStock}).`)
      return
    }

    // Add to list
    setAddedItems((prev) => {
      // Check if already exists, overwrite or append
      const existingIdx = prev.findIndex((i) => i.itemId === subModalItem.id)
      if (existingIdx > -1) {
        const updated = [...prev]
        updated[existingIdx] = {
          itemId: subModalItem.id,
          name: subModalItem.name,
          quantity: qty,
          unitValue: unitVal,
        }
        return updated
      }
      return [
        ...prev,
        {
          itemId: subModalItem.id,
          name: subModalItem.name,
          quantity: qty,
          unitValue: unitVal,
        },
      ]
    })

    // Reset sub-modal and search input
    setSubModalOpen(false)
    setSubModalItem(null)
    setItemSearchQuery('')
  }

  const handleRemoveItem = (itemId: string) => {
    setAddedItems((prev) => prev.filter((i) => i.itemId !== itemId))
  }

  // Calculate sum of total values in local items list
  const grandTotal = addedItems.reduce((acc, i) => acc + i.unitValue * i.quantity, 0)

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="gap-2 cursor-pointer">
            <Plus className="h-4 w-4" />
            Nova Transação
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar Transações</DialogTitle>
            <DialogDescription>
              Insira os detalhes de entrada ou saída para múltiplos itens do catálogo.
            </DialogDescription>
          </DialogHeader>

          <form action={formAction} className="relative space-y-4">
            {/* Main unit/sector/type settings */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Tipo de Movimentação</Label>
                <select
                  id="type"
                  name="type"
                  required
                  value={type}
                  onChange={(e) => {
                    setType(e.target.value as 'ENTRY' | 'EXIT')
                    setAddedItems([]) // Clear items on type switch to prevent stock checking mismatch
                  }}
                  className="border-outline bg-surface text-on-surface focus-visible:border-primary focus-visible:ring-primary h-10 w-full cursor-pointer rounded-md border px-3 py-2 text-sm focus-visible:ring-1 focus-visible:outline-none"
                >
                  <option value="ENTRY">Entrada (Estoque)</option>
                  <option value="EXIT">Saída (Consumo / Setor)</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="unitId">Unidade</Label>
                <select
                  id="unitId"
                  name="unitId"
                  required
                  value={selectedUnitId}
                  onChange={(e) => {
                    setSelectedUnitId(e.target.value)
                    setAddedItems([]) // Clear items to prevent unit stock mismatch
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

              {/* Dynamic Sector field: Automatic "Estoque" for ENTRY, Required dropdown for EXIT */}
              <div className="space-y-2">
                <Label htmlFor="sectorId">
                  {type === 'ENTRY' ? 'Setor de Entrada' : 'Setor de Saída (Destino) *'}
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
                <Label htmlFor="date">Data (Opcional)</Label>
                <DatePicker
                  id="date"
                  name="date"
                  value={dateInput}
                  onChange={setDateInput}
                  outputFormat="YYYY-MM-DD"
                />
              </div>
            </div>

            {/* Autocomplete Search input */}
            <div ref={dropdownRef} className="relative space-y-2">
              <Label>Adicionar Item ao Lote</Label>
              <div className="relative">
                <Search className="text-on-surface-variant absolute top-3 left-3 h-4 w-4" />
                <Input
                  placeholder="Clique para buscar e selecionar um item..."
                  className="bg-surface pl-10"
                  value={itemSearchQuery}
                  onFocus={() => setShowItemDropdown(true)}
                  onChange={(e) => {
                    setItemSearchQuery(e.target.value)
                    setShowItemDropdown(true)
                  }}
                />
              </div>

              {showItemDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-surface border border-outline rounded-md max-h-48 overflow-y-auto shadow-lg">
                  {filteredItems.length === 0 ? (
                    <div className="p-3 text-sm text-on-surface-variant italic">Nenhum item encontrado</div>
                  ) : (
                    filteredItems.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className="w-full text-left p-3 hover:bg-surface-container text-sm cursor-pointer border-b last:border-0 border-outline/30 text-on-surface font-medium"
                        onClick={() => {
                          setSubModalItem(item)
                          setSubQuantity('1')
                          setSubUnitValueMask('')
                          setStockValidationMsg('')
                          if (type === 'EXIT') {
                            setCheckingStock(true)
                            getItemMetricsAction(item.id, selectedUnitId)
                              .then((metrics) => {
                                if (metrics) {
                                  setSubStock(metrics.currentStock)
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
                          setSubModalOpen(true)
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span>{item.name}</span>
                          {item.category?.name && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-normal">
                              {item.category.name}
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <div className="text-xs text-on-surface-variant font-normal">
                            {item.description}
                          </div>
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Added items list preview */}
            <div className="space-y-2 pt-2">
              <Label>Itens Adicionados ({addedItems.length})</Label>
              {addedItems.length === 0 ? (
                <div className="border border-dashed border-outline rounded-md p-6 text-center text-sm text-on-surface-variant">
                  Nenhum item selecionado. Busque acima para adicionar itens à movimentação.
                </div>
              ) : (
                <div className="border border-outline rounded-md divide-y divide-outline/50 max-h-48 overflow-y-auto">
                  {addedItems.map((item) => (
                    <div key={item.itemId} className="p-3 flex items-center justify-between text-sm bg-surface">
                      <div>
                        <p className="font-semibold text-on-surface">{item.name}</p>
                        <p className="text-xs text-on-surface-variant">
                          Qtd: <span className="font-medium text-on-surface">{item.quantity}</span> |
                          Valor Unit: <span className="font-medium text-on-surface">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.unitValue)}
                          </span> |
                          Subtotal: <span className="font-semibold text-primary">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.quantity * item.unitValue)}
                          </span>
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-error hover:text-error/80 cursor-pointer"
                        onClick={() => handleRemoveItem(item.itemId)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Summary total */}
            {addedItems.length > 0 && (
              <div className="flex justify-between items-center py-2 px-3 bg-surface-container rounded-md">
                <span className="text-sm font-semibold text-on-surface">Valor Total da Movimentação:</span>
                <span className="text-base font-bold text-primary">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(grandTotal)}
                </span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending || addedItems.length === 0}>
                {isPending ? 'Salvando...' : 'Salvar Transações'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Sub Modal: Configure Quantity and Value for Selected Item */}
      <Dialog open={subModalOpen} onOpenChange={setSubModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Configurar Item</DialogTitle>
            <DialogDescription>
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
                    Estoque Atual nesta unidade: <span className="text-primary font-bold text-sm">{subStock ?? '-'}</span>
                  </p>
                )}
                {stockValidationMsg && (
                  <p className="text-error font-medium">{stockValidationMsg}</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="sub-quantity">Quantidade</Label>
              <Input
                id="sub-quantity"
                type="number"
                min="1"
                value={subQuantity}
                onChange={(e) => {
                  setSubQuantity(e.target.value)
                  setStockValidationMsg('')
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sub-value">Valor Unitário (R$)</Label>
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
              />
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
            >
              Cancelar
            </Button>
            <Button type="button" onClick={handleConfirmSubModal}>
              Confirmar Item
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
