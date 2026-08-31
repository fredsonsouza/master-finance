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
import type { Category } from '@/http/get-categories'
import type { Sector } from '@/http/get-sectors'
import type { Unit } from '@/http/get-units'
import type { User, UserPagination } from '@/http/get-users'
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Filter,
  KeyRound,
  Loader2,
  Pencil,
  Search,
  Tag,
  Trash2,
  UserCheck,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  deleteSectorAction,
  deleteUnitAction,
  deleteUserAction,
  fetchUsersAction,
} from './actions'
import { CreateCategoryDialog } from './create-category-dialog'
import { CreateSectorDialog } from './create-sector-dialog'
import { CreateUnitDialog } from './create-unit-dialog'
import { CreateUserDialog } from './create-user-dialog'
import { ResetPasswordDialog } from './reset-password-dialog'
import { UpdateCategoryDialog } from './update-category-dialog'
import { UpdateSectorDialog } from './update-sector-dialog'
import { UpdateUnitDialog } from './update-unit-dialog'
import { UpdateUserDialog } from './update-user-dialog'

interface SettingsContentProps {
  users: User[]
  userPagination?: UserPagination
  units: Unit[]
  sectors: Sector[]
  categories?: Category[]
  activeUnitId: string | null
  currentUserRole: string
}

export function SettingsContent({
  users,
  userPagination,
  units,
  sectors,
  categories = [],
  activeUnitId,
  currentUserRole,
}: SettingsContentProps) {
  const isAdmin = !currentUserRole || currentUserRole.toUpperCase() === 'ADMIN'

  const [usersState, setUsersState] = useState<User[]>(users)
  const [userPaginationState, setUserPaginationState] = useState<UserPagination>(
    userPagination || {
      page: 1,
      perPage: 20,
      totalCount: users.length,
      totalPages: Math.ceil(users.length / 20) || 1,
    }
  )

  const [searchUsers, setSearchUsers] = useState('')
  const [activeUserSearch, setActiveUserSearch] = useState('')
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('')
  const [selectedUnitFilter, setSelectedUnitFilter] = useState('')
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)

  const [searchUnits, setSearchUnits] = useState('')
  const [searchSectors, setSearchSectors] = useState('')
  const [searchCategories, setSearchCategories] = useState('')

  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deletingUser, setDeletingUser] = useState<User | null>(null)
  const [resettingPasswordUser, setResettingPasswordUser] = useState<User | null>(null)

  const [editingUnit, setEditingUnit] = useState<Unit | null>(null)
  const [deletingUnit, setDeletingUnit] = useState<Unit | null>(null)

  const [editingSector, setEditingSector] = useState<Sector | null>(null)
  const [deletingSector, setDeletingSector] = useState<Sector | null>(null)

  const [editingCategory, setEditingCategory] = useState<Category | null>(null)

  const [isDeleting, setIsDeleting] = useState(false)

  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchCategories.toLowerCase())
  )

  async function loadUsersPage(
    page: number,
    search = activeUserSearch,
    role = selectedRoleFilter,
    unitId = selectedUnitFilter
  ) {
    setIsLoadingUsers(true)
    const res = await fetchUsersAction({
      page,
      perPage: userPaginationState.perPage || 20,
      search: search || undefined,
      role: role || undefined,
      unitId: unitId || undefined,
    })

    if (res.success && res.data) {
      setUsersState(res.data.users)
      setUserPaginationState(res.data.pagination)
    } else {
      toast.error('Erro ao carregar lista de usuários.')
    }
    setIsLoadingUsers(false)
  }

  async function handleUserSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    setActiveUserSearch(searchUsers.trim())
    await loadUsersPage(1, searchUsers.trim(), selectedRoleFilter, selectedUnitFilter)
  }

  async function handleRoleFilterChange(role: string) {
    setSelectedRoleFilter(role)
    await loadUsersPage(1, activeUserSearch, role, selectedUnitFilter)
  }

  async function handleUnitFilterChange(unitId: string) {
    setSelectedUnitFilter(unitId)
    await loadUsersPage(1, activeUserSearch, selectedRoleFilter, unitId)
  }

  async function handleClearUserFilters() {
    setSearchUsers('')
    setActiveUserSearch('')
    setSelectedRoleFilter('')
    setSelectedUnitFilter('')
    await loadUsersPage(1, '', '', '')
  }

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
    SELLER: 'bg-sky-500 text-white',
    FINANCIAL: 'bg-amber-500 text-white',
    COLLECTOR: 'bg-emerald-500 text-white',
    FISCAL: 'bg-purple-500 text-white',
    INVENTORY: 'bg-slate-600 text-white',
    ANALYST: 'bg-teal-600 text-white',
  }

  const roleNames: Record<string, string> = {
    ADMIN: 'Administrador',
    MANAGER: 'Gerente',
    EMPLOYEE: 'Funcionário',
    SELLER: 'Caixa',
    FINANCIAL: 'Financeiro',
    COLLECTOR: 'Coletador',
    FISCAL: 'Fiscal',
    INVENTORY: 'Estoque',
    ANALYST: 'Analista',
  }

  async function confirmDeleteUser() {
    if (!deletingUser) return
    setIsDeleting(true)
    const result = await deleteUserAction(deletingUser.id)
    if (result.success) {
      toast.success('Usuário excluído com sucesso!')
      setDeletingUser(null)
      await loadUsersPage(userPaginationState.page)
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
    <Tabs defaultValue={currentUserRole === 'INVENTORY' ? 'units' : 'users'} className="w-full">
      <TabsList className="mb-4">
        {currentUserRole !== 'INVENTORY' && (
          <TabsTrigger value="users">Usuários</TabsTrigger>
        )}
        <TabsTrigger value="units">Unidades</TabsTrigger>
        <TabsTrigger value="sectors">Setores</TabsTrigger>
        <TabsTrigger value="categories">Categorias</TabsTrigger>
      </TabsList>

      {currentUserRole !== 'INVENTORY' && (
        <TabsContent value="users">
          <Card className="border-surface-container shadow-sm">
            <CardHeader className="flex flex-col gap-4 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-xl font-bold text-primary">
                    Usuários Cadastrados
                  </CardTitle>
                  {userPaginationState.totalCount > 0 && (
                    <p className="text-xs text-on-surface-variant font-medium mt-1">
                      Exibindo <span className="font-bold text-on-surface">{usersState.length}</span> de{' '}
                      <span className="font-bold text-on-surface">{userPaginationState.totalCount}</span> usuários
                    </p>
                  )}
                </div>

                {currentUserRole === 'ADMIN' && (
                  <CreateUserDialog
                    units={units}
                    activeUnitId={activeUnitId}
                    currentUserRole={currentUserRole}
                  />
                )}
              </div>

              {/* USER FILTERS & SEARCH CONTROL BAR */}
              <form
                onSubmit={handleUserSearchSubmit}
                className="flex flex-col md:flex-row items-stretch md:items-center gap-3 pt-2"
              >
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="text-on-surface-variant absolute top-2.5 left-2.5 h-4 w-4" />
                  <Input
                    placeholder="Buscar por nome ou username..."
                    className="bg-surface pl-8 h-9 text-xs"
                    value={searchUsers}
                    onChange={(e) => setSearchUsers(e.target.value)}
                  />
                  {searchUsers && (
                    <button
                      type="button"
                      onClick={() => setSearchUsers('')}
                      className="absolute right-2.5 top-2.5 text-on-surface-variant hover:text-on-surface cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Role Filter */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <UserCheck className="h-4 w-4 text-primary hidden sm:block" />
                  <select
                    value={selectedRoleFilter}
                    onChange={(e) => handleRoleFilterChange(e.target.value)}
                    className="h-9 rounded-md border border-outline bg-surface text-on-surface px-2.5 text-xs font-medium focus:ring-1 focus:ring-primary cursor-pointer w-full md:w-44"
                  >
                    <option value="">Todos os Cargos</option>
                    {Object.entries(roleNames).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Unit Filter */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <Building2 className="h-4 w-4 text-primary hidden sm:block" />
                  <select
                    value={selectedUnitFilter}
                    onChange={(e) => handleUnitFilterChange(e.target.value)}
                    className="h-9 rounded-md border border-outline bg-surface text-on-surface px-2.5 text-xs font-medium focus:ring-1 focus:ring-primary cursor-pointer w-full md:w-48"
                  >
                    <option value="">Todas as Unidades</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Submit & Clear Buttons */}
                <div className="flex items-center gap-2">
                  <Button
                    type="submit"
                    disabled={isLoadingUsers}
                    size="sm"
                    className="h-9 text-xs font-semibold px-3 cursor-pointer gap-1"
                  >
                    {isLoadingUsers ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Search className="h-3.5 w-3.5" />
                    )}
                    Buscar
                  </Button>

                  {(activeUserSearch || selectedRoleFilter || selectedUnitFilter || searchUsers) && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleClearUserFilters}
                      disabled={isLoadingUsers}
                      className="h-9 text-xs font-medium px-2.5 cursor-pointer text-on-surface-variant hover:text-on-surface"
                    >
                      Limpar
                    </Button>
                  )}
                </div>
              </form>
            </CardHeader>
            <CardContent>
              {isLoadingUsers ? (
                <div className="flex items-center justify-center py-12 text-on-surface-variant gap-2 text-sm">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  Carregando lista de usuários...
                </div>
              ) : usersState.length === 0 ? (
                <div className="text-on-surface-variant py-10 text-center text-sm space-y-2">
                  <p>Nenhum usuário encontrado com os filtros selecionados.</p>
                  {(activeUserSearch || selectedRoleFilter || selectedUnitFilter) && (
                    <Button
                      variant="ghost"
                      onClick={handleClearUserFilters}
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
                          <th className="px-6 py-3 font-semibold">Username</th>
                          <th className="px-6 py-3 font-semibold">Cargo</th>
                          <th className="px-6 py-3 font-semibold">Unidade</th>
                          {isAdmin && (
                            <th className="px-6 py-3 text-right font-semibold">
                              Ações
                            </th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-surface-container divide-y">
                        {usersState.map((u) => {
                          const uUnit = units.find((unit) => unit.id === u.unitId)

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
                              {isAdmin && (
                                <td className="px-6 py-4 text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      title="Redefinir / Alterar Senha"
                                      className="text-on-surface hover:text-amber-500 hover:bg-amber-500/10 h-8 w-8 cursor-pointer"
                                      onClick={() => setResettingPasswordUser(u)}
                                    >
                                      <KeyRound className="h-4 w-4 text-amber-500" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      title="Editar Usuário"
                                      className="text-on-surface hover:text-primary h-8 w-8 cursor-pointer"
                                      onClick={() => setEditingUser(u)}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      title="Excluir Usuário"
                                      className="text-on-surface hover:text-error h-8 w-8 cursor-pointer"
                                      onClick={() => setDeletingUser(u)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </td>
                              )}
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* USER TABLE PAGINATION CONTROLS (20 items per page) */}
                  {userPaginationState.totalPages > 1 && (
                    <div className="flex items-center justify-between pt-4 border-t border-outline/20 text-xs">
                      <div className="text-on-surface-variant font-medium">
                        Página <span className="font-bold text-on-surface">{userPaginationState.page}</span> de{' '}
                        <span className="font-bold text-on-surface">{userPaginationState.totalPages}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={userPaginationState.page <= 1 || isLoadingUsers}
                          onClick={() => loadUsersPage(userPaginationState.page - 1)}
                          className="h-8 gap-1 text-xs cursor-pointer"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Anterior
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={userPaginationState.page >= userPaginationState.totalPages || isLoadingUsers}
                          onClick={() => loadUsersPage(userPaginationState.page + 1)}
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
        </TabsContent>
      )}

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
                      <th className="px-6 py-3 font-semibold">Nome da Unidade</th>
                      <th className="px-6 py-3 font-semibold">Data de Criação</th>
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
            <CardTitle className="text-xl">Setores Cadastrados</CardTitle>
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
                      <th className="px-6 py-3 font-semibold">Nome do Setor</th>
                      <th className="px-6 py-3 font-semibold">Data de Criação</th>
                      <th className="px-6 py-3 text-right font-semibold">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-surface-container divide-y">
                    {filteredSectors.map((sector) => (
                      <tr
                        key={sector.id}
                        className="hover:bg-surface-container-lowest transition-colors"
                      >
                        <td className="text-on-surface px-6 py-4 font-medium">
                          {sector.name}
                        </td>
                        <td className="text-on-surface-variant px-6 py-4">
                          {new Date(sector.createdAt).toLocaleDateString('pt-BR')}
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
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="categories">
        <Card className="border-surface-container shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-xl font-bold text-primary">
                Categorias de Itens
              </CardTitle>
              <p className="text-xs text-on-surface-variant font-medium mt-1">
                Classificações para organizar e filtrar o catálogo de produtos e insumos.
              </p>
            </div>
            <CreateCategoryDialog />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="text-on-surface-variant absolute top-2.5 left-2.5 h-4 w-4" />
              <Input
                placeholder="Buscar categoria..."
                className="bg-surface pl-8 h-9 text-xs"
                value={searchCategories}
                onChange={(e) => setSearchCategories(e.target.value)}
              />
              {searchCategories && (
                <button
                  type="button"
                  onClick={() => setSearchCategories('')}
                  className="absolute right-2.5 top-2.5 text-on-surface-variant hover:text-on-surface cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {filteredCategories.length === 0 ? (
              <div className="py-8 text-center text-sm text-on-surface-variant">
                Nenhuma categoria encontrada.
              </div>
            ) : (
              <div className="border-surface-container overflow-hidden rounded-md border">
                <table className="w-full text-left text-sm">
                  <thead className="bg-surface-container-highest/50 text-xs font-semibold uppercase text-on-surface-variant">
                    <tr>
                      <th className="px-6 py-3">Nome da Categoria</th>
                      <th className="px-6 py-3">Criado em</th>
                      <th className="px-6 py-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container">
                    {filteredCategories.map((category) => (
                      <tr
                        key={category.id}
                        className="hover:bg-surface-container/50 transition-colors"
                      >
                        <td className="px-6 py-4 font-medium text-on-surface">
                          <div className="flex items-center gap-2">
                            <Tag className="h-4 w-4 text-primary" />
                            <span>{category.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-on-surface-variant">
                          {new Date(category.createdAt).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-on-surface hover:text-primary h-8 w-8 cursor-pointer"
                              onClick={() => setEditingCategory(category)}
                              title="Editar Categoria"
                            >
                              <Pencil className="h-4 w-4" />
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

      {/* Edit User Dialog */}
      {editingUser && (
        <UpdateUserDialog
          user={editingUser}
          units={units}
          activeUnitId={activeUnitId}
          currentUserRole={currentUserRole}
          onClose={() => setEditingUser(null)}
        />
      )}

      {/* Reset User Password Dialog (Admin Only) */}
      {resettingPasswordUser && (
        <ResetPasswordDialog
          user={resettingPasswordUser}
          onClose={() => setResettingPasswordUser(null)}
        />
      )}

      {/* Edit Unit Dialog */}
      {editingUnit && (
        <UpdateUnitDialog
          unit={editingUnit}
          onClose={() => setEditingUnit(null)}
        />
      )}

      {/* Edit Sector Dialog */}
      {editingSector && (
        <UpdateSectorDialog
          sector={editingSector}
          onClose={() => setEditingSector(null)}
        />
      )}

      {/* Edit Category Dialog */}
      {editingCategory && (
        <UpdateCategoryDialog
          category={editingCategory}
          open={!!editingCategory}
          onOpenChange={(open) => !open && setEditingCategory(null)}
        />
      )}

      {/* Delete User Confirmation Dialog */}
      <Dialog
        open={!!deletingUser}
        onOpenChange={(open) => !open && setDeletingUser(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Usuário</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o usuário{' '}
              <span className="font-semibold text-on-surface">
                {deletingUser?.name}
              </span>
              ? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setDeletingUser(null)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmDeleteUser}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold"
            >
              {isDeleting ? 'Excluindo...' : 'Confirmar Exclusão'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Unit Confirmation Dialog */}
      <Dialog
        open={!!deletingUnit}
        onOpenChange={(open) => !open && setDeletingUnit(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Unidade</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir a unidade{' '}
              <span className="font-semibold text-on-surface">
                {deletingUnit?.name}
              </span>
              ? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setDeletingUnit(null)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmDeleteUnit}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold"
            >
              {isDeleting ? 'Excluindo...' : 'Confirmar Exclusão'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Sector Confirmation Dialog */}
      <Dialog
        open={!!deletingSector}
        onOpenChange={(open) => !open && setDeletingSector(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Setor</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o setor{' '}
              <span className="font-semibold text-on-surface">
                {deletingSector?.name}
              </span>
              ? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setDeletingSector(null)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmDeleteSector}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold"
            >
              {isDeleting ? 'Excluindo...' : 'Confirmar Exclusão'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Tabs>
  )
}
