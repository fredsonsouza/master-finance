'use client'

import { Button } from '@/components/ui/button'
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
import type { Category } from '@/http/get-categories'
import { DollarSign, Loader2, Plus, Tag } from 'lucide-react'
import { useActionState, useState } from 'react'
import { toast } from 'sonner'
import { createCategoryAction, createItemAction } from './actions'

interface Props {
  categories: Category[]
}

export function CreateItemDialog({ categories: initialCategories }: Props) {
  const [open, setOpen] = useState(false)
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [newCategoryName, setNewCategoryName] = useState('')
  const [isCreatingCategory, setIsCreatingCategory] = useState(false)
  const [valueMask, setValueMask] = useState('')

  const [state, formAction, isPending] = useActionState(
    async (
      prevState: { success: boolean; message: string | null },
      formData: FormData
    ) => {
      formData.set('categoryId', selectedCategoryId)
      formData.set('value', valueMask)
      const result = await createItemAction(formData)
      if (result.success) {
        toast.success('Item adicionado ao catálogo com sucesso!')
        setOpen(false)
        setSelectedCategoryId('')
        setNewCategoryName('')
        setValueMask('')
      } else if (result.message) {
        toast.error(result.message)
      }
      return result
    },
    { success: false, message: null }
  )

  async function handleAddCategory(e: React.MouseEvent | React.KeyboardEvent) {
    e.preventDefault()
    e.stopPropagation()

    const name = newCategoryName.trim()
    if (!name) {
      toast.error('Digite o nome da categoria.')
      return
    }

    setIsCreatingCategory(true)
    const result = await createCategoryAction(name)
    if (result.success && result.category) {
      setCategories((prev) => {
        if (prev.some((c) => c.id === result.category!.id)) return prev
        return [...prev, result.category!]
      })
      setSelectedCategoryId(result.category.id)
      setNewCategoryName('')
      toast.success(`Categoria "${result.category.name}" criada e selecionada!`)
    } else {
      toast.error(result.message || 'Erro ao criar categoria.')
    }
    setIsCreatingCategory(false)
  }

  function handleValueChange(rawInput: string) {
    const numericDigits = rawInput.replace(/\D/g, '')
    if (!numericDigits) {
      setValueMask('')
      return
    }
    const numericValue = Number(numericDigits) / 100
    setValueMask(
      new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(numericValue)
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 cursor-pointer">
          <Plus className="h-4 w-4" />
          Novo Item
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Adicionar ao Catálogo</DialogTitle>
          <DialogDescription>
            Crie um novo item, produto ou procedimento e defina seus dados base.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Item *</Label>
            <Input
              id="name"
              name="name"
              required
              placeholder="Ex: Luvas de Procedimento (Caixa)"
            />
          </div>

          {/* Category selection and inline quick creation */}
          <div className="space-y-2">
            <Label htmlFor="categoryId" className="flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-primary" />
              Categoria
            </Label>

            <select
              id="categoryId"
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="border-outline bg-surface text-on-surface focus-visible:border-primary focus-visible:ring-primary h-10 w-full cursor-pointer rounded-md border px-3 py-2 text-sm focus-visible:ring-1 focus-visible:outline-none"
            >
              <option value="">Nenhuma Categoria</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            {/* Inline Quick Add Category Input + Plus Button */}
            <div className="pt-1">
              <Label className="text-[11px] text-on-surface-variant block mb-1">
                Ou adicione uma nova categoria:
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddCategory(e)
                    }
                  }}
                  placeholder="Nome da nova categoria..."
                  className="h-9 text-xs flex-1 bg-surface-container-lowest"
                  disabled={isCreatingCategory}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddCategory}
                  disabled={isCreatingCategory || !newCategoryName.trim()}
                  className="h-9 px-3 gap-1 text-xs cursor-pointer shrink-0 border-primary/40 hover:bg-primary/10 text-primary"
                  title="Criar Categoria"
                >
                  {isCreatingCategory ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Plus className="h-3.5 w-3.5" />
                  )}
                  Criar
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Formatted Currency Value input */}
            <div className="space-y-2">
              <Label htmlFor="value" className="flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                Valor Base Unitário (R$)
              </Label>
              <Input
                id="value"
                name="value"
                value={valueMask}
                onChange={(e) => handleValueChange(e.target.value)}
                placeholder="R$ 0,00"
              />
            </div>

            {/* Initial Quantity input */}
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantidade Inicial</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                min="0"
                placeholder="Ex: 50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição (Opcional)</Label>
            <Input
              id="description"
              name="description"
              placeholder="Ex: Caixa com 100 unidades"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Salvando...' : 'Salvar Item'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
