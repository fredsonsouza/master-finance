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
import { Plus, Trash2, Loader2, Search } from 'lucide-react'
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
          <Button className="gap-2">
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
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Tipo</Label>
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
                  <option value="ENTRY">Entrada (Compra)</option>
                  <option value="EXIT">Saída (Consumo)</option>
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
              <div className="space-y-2">
                <Label htmlFor="sectorId">Setor</Label>
                <select
                  id="sectorId"
                  name="sectorId"
                  required
                  value={selectedSectorId}
                  onChange={(e) => setSelectedSectorId(e.target.value)}
                  className="border-outline bg-surface text-on-surface focus-visible:border-primary focus-visible:ring-primary h-10 w-full cursor-pointer rounded-md border px-3 py-2 text-sm focus-visible:ring-1 focus-visible:outline-none"
                >
                  <option value="">Selecione o setor...</option>
                  {sectors.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                                  if (metrics.lastPrice !== null) {
                                    setSubUnitValueMask(
                                      new Intl.NumberFormat('pt-BR', {
                                        style: 'currency',
                                        currency: 'BRL',
                                      }).format(metrics.lastPrice)
                                    )
                                  }
                                } else {
                                  setSubStock(0)
                                }
                              })
                              .catch(() => setSubStock(0))
                              .finally(() => setCheckingStock(false))
                          } else {
                            setSubStock(null)
                          }
                          setSubModalOpen(true)
                          setShowItemDropdown(false)
                        }}
                      >
                        {item.name}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Table of selected items */}
            <div className="border border-outline rounded-md bg-surface-container-low max-h-48 overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-container-highest text-on-surface text-xs uppercase">
                  <tr>
                    <th className="px-4 py-2 font-semibold">Item</th>
                    <th className="px-4 py-2 font-semibold text-center">Qtd</th>
                    <th className="px-4 py-2 font-semibold text-right">Total</th>
                    <th className="px-4 py-2 font-semibold text-right">Unitário</th>
                    <th className="px-4 py-2 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-surface-container divide-y">
                  {addedItems.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-on-surface-variant italic text-xs">
                        Nenhum item adicionado a esta transação.
                      </td>
                    </tr>
                  ) : (
                    addedItems.map((item) => (
                      <tr key={item.itemId} className="text-on-surface">
                        <td className="px-4 py-2 font-medium break-words">
                          {item.name}
                        </td>
                        <td className="px-4 py-2 text-center">{item.quantity}</td>
                        <td className="px-4 py-2 text-right font-medium">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(item.unitValue * item.quantity)}
                        </td>
                        <td className="px-4 py-2 text-right text-xs text-on-surface-variant tabular-nums">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(item.unitValue)}
                        </td>
                        <td className="px-4 py-2 text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-error hover:bg-error/10 cursor-pointer"
                            onClick={() => handleRemoveItem(item.itemId)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Grand total helper */}
            {addedItems.length > 0 && (
              <div className="flex justify-end pr-4 text-sm font-bold text-on-surface">
                Valor Total do Lote:{' '}
                <span className="text-primary ml-1 tabular-nums">
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

            {/* Footer buttons */}
            <div className="flex justify-end gap-2 pt-4 border-t border-outline/30">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpen(false)
                  setAddedItems([])
                }}
                className="bg-transparent text-on-surface hover:bg-surface-container cursor-pointer"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending || addedItems.length === 0} className="cursor-pointer">
                {isPending ? 'Salvando...' : 'Salvar Transações'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Sibling Portal-rendered Sub-dialog to prevent dimensions and overlay clipping */}
      <Dialog
        open={subModalOpen}
        onOpenChange={(val) => {
          if (!val) {
            setSubModalOpen(false)
            setSubModalItem(null)
          }
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Definir Quantidade e Valor</DialogTitle>
            <DialogDescription>
              Especifique a quantidade e o valor unitário para o item selecionado.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-primary block">Item Selecionado</span>
              <span className="text-sm font-medium text-on-surface block">
                {subModalItem?.name}
              </span>
              {type === 'EXIT' && (
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-on-surface-variant">
                    Estoque Disponível:
                  </span>
                  {checkingStock ? (
                    <Loader2 className="h-3 w-3 animate-spin text-primary" />
                  ) : (
                    <span
                      className={`text-xs font-bold ${subStock === 0 ? 'text-error' : 'text-success'}`}
                    >
                      {subStock ?? 0} unidades
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="subQuantity">Quantidade</Label>
                <Input
                  id="subQuantity"
                  type="number"
                  min="1"
                  value={subQuantity}
                  onChange={(e) => {
                    setSubQuantity(e.target.value)
                    setStockValidationMsg('')
                  }}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="subUnitValue">Valor Unitário (R$)</Label>
                <Input
                  id="subUnitValue"
                  type="text"
                  placeholder="R$ 0,00"
                  value={subUnitValueMask}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '')
                    if (val === '') {
                      setSubUnitValueMask('')
                      return
                    }
                    const num = Number(val) / 100
                    setSubUnitValueMask(
                      new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(num)
                    )
                  }}
                  required
                />
              </div>
            </div>

            {stockValidationMsg && (
              <p className="text-xs text-error font-medium">{stockValidationMsg}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-outline/30">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setSubModalOpen(false)
                setSubModalItem(null)
              }}
              className="cursor-pointer"
            >
              Voltar
            </Button>
            <Button
              type="button"
              onClick={handleConfirmSubModal}
              disabled={checkingStock || (type === 'EXIT' && subStock === 0)}
              className="cursor-pointer"
            >
              Confirmar e Adicionar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
