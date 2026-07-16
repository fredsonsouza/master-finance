'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Sector } from '@/http/get-sectors'
import type { Unit } from '@/http/get-units'
import type { User } from '@/http/get-users'
import { Pencil, Search, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  deleteSectorAction,
  deleteUnitAction,
  deleteUserAction,
} from './actions'
import { CreateSectorDialog } from './create-sector-dialog'
import { CreateUnitDialog } from './create-unit-dialog'
import { CreateUserDialog } from './create-user-dialog'
import { UpdateSectorDialog } from './update-sector-dialog'
import { UpdateUnitDialog } from './update-unit-dialog'
import { UpdateUserDialog } from './update-user-dialog'

interface SettingsContentProps {
  users: User[]
  units: Unit[]
  sectors: Sector[]
  activeUnitId: string | null
  currentUserRole: string
}

export function SettingsContent({
  users,
  units,
  sectors,
  activeUnitId,
  currentUserRole,
}: SettingsContentProps) {
  const [searchUsers, setSearchUsers] = useState('')
  const [searchUnits, setSearchUnits] = useState('')
  const [searchSectors, setSearchSectors] = useState('')

  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deletingUser, setDeletingUser] = useState<User | null>(null)

  const [editingUnit, setEditingUnit] = useState<Unit | null>(null)
  const [deletingUnit, setDeletingUnit] = useState<Unit | null>(null)

  const [editingSector, setEditingSector] = useState<Sector | null>(null)
  const [deletingSector, setDeletingSector] = useState<Sector | null>(null)

  const [isDeleting, setIsDeleting] = useState(false)

  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(searchUsers.toLowerCase()) ||
      u.username.toLowerCase().includes(searchUsers.toLowerCase())
  )

  const filteredUnits = units.filter((u) =>
    u.name.toLowerCase().includes(searchUnits.toLowerCase())
  )

  const filteredSectors = sectors.filter((s) =>
    s.name.toLowerCase().includes(searchSectors.toLowerCase())
  )

  const roleColors: Record<string, string> = {
    ADMIN: 'bg-primary text-on-primary',
    MANAGER: 'bg-success text-on-success',
    EMPLOYEE: 'bg-surface-variant text-on-surface-variant',
  }

  const roleNames: Record<string, string> = {
    ADMIN: 'Administrador',
    MANAGER: 'Gerente',
    EMPLOYEE: 'Funcionário',
    SELLER: 'Caixa',
    FINANCIAL: 'Financeiro',
    COLLECTOR: 'Coletador',
  }

  async function confirmDeleteUser() {
    if (!deletingUser) return
    setIsDeleting(true)
    const result = await deleteUserAction(deletingUser.id)
    if (result.success) {
      toast.success('Usuário excluído com sucesso!')
      setDeletingUser(null)
    } else {
      toast.error(result.message || 'Erro ao excluir usuário.')
    }
    setIsDeleting(false)
  }

  async function confirmDeleteUnit() {
    if (!deletingUnit) return
    setIsDeleting(true)
    const result = await deleteUnitAction(deletingUnit.id)
    if (result.success) {
      toast.success('Unidade excluída com sucesso!')
      setDeletingUnit(null)
    } else {
      toast.error(result.message || 'Erro ao excluir unidade.')
    }
    setIsDeleting(false)
  }

  async function confirmDeleteSector() {
    if (!deletingSector) return
    setIsDeleting(true)
    const result = await deleteSectorAction(deletingSector.id)
    if (result.success) {
      toast.success('Setor excluído com sucesso!')
      setDeletingSector(null)
    } else {
      toast.error(result.message || 'Erro ao excluir setor.')
    }
    setIsDeleting(false)
  }

  return (
    <Tabs defaultValue="users" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="users">Usuários</TabsTrigger>
        <TabsTrigger value="units">Unidades</TabsTrigger>
        <TabsTrigger value="sectors">Setores</TabsTrigger>
      </TabsList>

      <TabsContent value="users">
        <Card>
          <CardHeader className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <CardTitle className="text-xl">Usuários Cadastrados</CardTitle>
            <div className="flex w-full items-center gap-2 sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="text-on-surface-variant absolute top-2.5 left-2.5 h-4 w-4" />
                <Input
                  placeholder="Buscar usuário..."
                  className="bg-surface pl-8"
                  value={searchUsers}
                  onChange={(e) => setSearchUsers(e.target.value)}
                />
              </div>
              <CreateUserDialog
                units={units}
                activeUnitId={activeUnitId}
                currentUserRole={currentUserRole}
              />
            </div>
          </CardHeader>
          <CardContent>
            {filteredUsers.length === 0 ? (
              <p className="text-on-surface-variant text-sm">
                Nenhum usuário encontrado.
              </p>
            ) : (
              <div className="relative overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-surface-container-highest text-on-surface text-xs uppercase">
                    <tr>
                      <th className="px-6 py-3 font-semibold">Nome</th>
                      <th className="px-6 py-3 font-semibold">Username</th>
                      <th className="px-6 py-3 font-semibold">Cargo</th>
                      <th className="px-6 py-3 font-semibold">Unidade</th>
                      <th className="px-6 py-3 text-right font-semibold">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-surface-container divide-y">
                    {filteredUsers.map((u) => {
                      const uUnit = units.find((unit) => unit.id === u.unitId)
                      const isManagerTryingToEditAdmin =
                        u.role === 'ADMIN' && currentUserRole !== 'ADMIN'

                      return (
                        <tr
                          key={u.id}
                          className="hover:bg-surface-container-lowest transition-colors"
                        >
                          <td className="text-on-surface px-6 py-4 font-medium">
                            {u.name}
                          </td>
                          <td className="text-on-surface-variant px-6 py-4">
                            {u.username}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${roleColors[u.role] || roleColors.EMPLOYEE}`}
                            >
                              {roleNames[u.role] || u.role}
                            </span>
                          </td>
                          <td className="text-on-surface-variant px-6 py-4">
                            {uUnit ? uUnit.name : 'Acesso Global'}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              {!isManagerTryingToEditAdmin && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-on-surface hover:text-primary h-8 w-8 cursor-pointer"
                                    onClick={() => setEditingUser(u)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-on-surface hover:text-error h-8 w-8 cursor-pointer"
                                    onClick={() => setDeletingUser(u)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="units">
        <Card>
          <CardHeader className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <CardTitle className="text-xl">Unidades (Clínicas)</CardTitle>
            <div className="flex w-full items-center gap-2 sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="text-on-surface-variant absolute top-2.5 left-2.5 h-4 w-4" />
                <Input
                  placeholder="Buscar unidade..."
                  className="bg-surface pl-8"
                  value={searchUnits}
                  onChange={(e) => setSearchUnits(e.target.value)}
                />
              </div>
              <CreateUnitDialog />
            </div>
          </CardHeader>
          <CardContent>
            {filteredUnits.length === 0 ? (
              <p className="text-on-surface-variant text-sm">
                Nenhuma unidade encontrada.
              </p>
            ) : (
              <div className="relative overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-surface-container-highest text-on-surface text-xs uppercase">
                    <tr>
                      <th className="px-6 py-3 font-semibold">Nome</th>
                      <th className="px-6 py-3 font-semibold">
                        Data de Criação
                      </th>
                      <th className="px-6 py-3 text-right font-semibold">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-surface-container divide-y">
                    {filteredUnits.map((unit) => (
                      <tr
                        key={unit.id}
                        className="hover:bg-surface-container-lowest transition-colors"
                      >
                        <td className="text-on-surface px-6 py-4 font-medium">
                          {unit.name}
                        </td>
                        <td className="text-on-surface-variant px-6 py-4">
                          {new Date(unit.createdAt).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-on-surface hover:text-primary h-8 w-8 cursor-pointer"
                              onClick={() => setEditingUnit(unit)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-on-surface hover:text-error h-8 w-8 cursor-pointer"
                              onClick={() => setDeletingUnit(unit)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="sectors">
        <Card>
          <CardHeader className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <CardTitle className="text-xl">Setores</CardTitle>
            <div className="flex w-full items-center gap-2 sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="text-on-surface-variant absolute top-2.5 left-2.5 h-4 w-4" />
                <Input
                  placeholder="Buscar setor..."
                  className="bg-surface pl-8"
                  value={searchSectors}
                  onChange={(e) => setSearchSectors(e.target.value)}
                />
              </div>
              <CreateSectorDialog />
            </div>
          </CardHeader>
          <CardContent>
            {filteredSectors.length === 0 ? (
              <p className="text-on-surface-variant text-sm">
                Nenhum setor encontrado.
              </p>
            ) : (
              <div className="relative overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-surface-container-highest text-on-surface text-xs uppercase">
                    <tr>
                      <th className="px-6 py-3 font-semibold">Nome</th>
                      <th className="px-6 py-3 text-right font-semibold">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-surface-container divide-y">
                    {filteredSectors.map((sector) => {
                      return (
                        <tr
                          key={sector.id}
                          className="hover:bg-surface-container-lowest transition-colors"
                        >
                          <td className="text-on-surface px-6 py-4 font-medium">
                            {sector.name}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-on-surface hover:text-primary h-8 w-8 cursor-pointer"
                                onClick={() => setEditingSector(sector)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-on-surface hover:text-error h-8 w-8 cursor-pointer"
                                onClick={() => setDeletingSector(sector)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <UpdateUserDialog
        user={editingUser}
        units={units}
        activeUnitId={activeUnitId}
        currentUserRole={currentUserRole}
        onClose={() => setEditingUser(null)}
      />
      <UpdateUnitDialog
        unit={editingUnit}
        onClose={() => setEditingUnit(null)}
      />
      <UpdateSectorDialog
        sector={editingSector}
        onClose={() => setEditingSector(null)}
      />

      {/* Delete User Confirmation Dialog */}
      <Dialog
        open={deletingUser !== null}
        onOpenChange={(val) => !val && setDeletingUser(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Você tem certeza que deseja excluir o usuário{' '}
              <strong>{deletingUser?.name}</strong>? Esta ação não pode ser
              desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setDeletingUser(null)}
              className="cursor-pointer bg-transparent"
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              className="bg-error hover:bg-error/90 text-on-error cursor-pointer"
              onClick={confirmDeleteUser}
              disabled={isDeleting}
            >
              {isDeleting ? 'Excluindo...' : 'Sim, Excluir'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Unit Confirmation Dialog */}
      <Dialog
        open={deletingUnit !== null}
        onOpenChange={(val) => !val && setDeletingUnit(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Você tem certeza que deseja excluir esta Unidade? Esta ação não
              pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setDeletingUnit(null)}
              className="cursor-pointer bg-transparent"
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              className="bg-error hover:bg-error/90 text-on-error cursor-pointer"
              onClick={confirmDeleteUnit}
              disabled={isDeleting}
            >
              {isDeleting ? 'Excluindo...' : 'Sim, Excluir'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Sector Confirmation Dialog */}
      <Dialog
        open={deletingSector !== null}
        onOpenChange={(val) => !val && setDeletingSector(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Você tem certeza que deseja excluir este Setor? Esta ação não pode
              ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setDeletingSector(null)}
              className="cursor-pointer bg-transparent"
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              className="bg-error hover:bg-error/90 text-on-error cursor-pointer"
              onClick={confirmDeleteSector}
              disabled={isDeleting}
            >
              {isDeleting ? 'Excluindo...' : 'Sim, Excluir'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Tabs>
  )
}
