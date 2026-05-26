'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Pencil, Trash2, Search } from 'lucide-react'
import { CreateUnitDialog } from './create-unit-dialog'
import { CreateSectorDialog } from './create-sector-dialog'
import { CreateUserDialog } from './create-user-dialog'

interface SettingsContentProps {
  users: any[]
  units: any[]
  sectors: any[]
  activeUnitId: string | null
}

export function SettingsContent({ users, units, sectors, activeUnitId }: SettingsContentProps) {
  const [searchUsers, setSearchUsers] = useState('')
  const [searchUnits, setSearchUnits] = useState('')
  const [searchSectors, setSearchSectors] = useState('')

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchUsers.toLowerCase()) || 
    u.username.toLowerCase().includes(searchUsers.toLowerCase())
  )

  const filteredUnits = units.filter(u => 
    u.name.toLowerCase().includes(searchUnits.toLowerCase())
  )

  const filteredSectors = sectors.filter(s => 
    s.name.toLowerCase().includes(searchSectors.toLowerCase())
  )

  const roleColors: Record<string, string> = {
    ADMIN: 'bg-primary text-on-primary',
    MANAGER: 'bg-success text-on-success',
    EMPLOYEE: 'bg-surface-variant text-on-surface-variant',
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
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle className="text-xl">Usuários Cadastrados</CardTitle>
            <div className="flex w-full sm:w-auto items-center gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-on-surface-variant" />
                <Input 
                  placeholder="Buscar usuário..." 
                  className="pl-8" 
                  value={searchUsers}
                  onChange={(e) => setSearchUsers(e.target.value)}
                />
              </div>
              <CreateUserDialog units={units} activeUnitId={activeUnitId} />
            </div>
          </CardHeader>
          <CardContent>
            {filteredUsers.length === 0 ? (
              <p className="text-sm text-on-surface-variant">Nenhum usuário encontrado.</p>
            ) : (
              <div className="relative overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-surface-container-highest text-on-surface uppercase text-xs">
                    <tr>
                      <th className="px-6 py-3 font-semibold">Nome</th>
                      <th className="px-6 py-3 font-semibold">Username</th>
                      <th className="px-6 py-3 font-semibold">Cargo</th>
                      <th className="px-6 py-3 font-semibold">Unidade</th>
                      <th className="px-6 py-3 font-semibold text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container">
                    {filteredUsers.map((u) => {
                      const uUnit = units.find(unit => unit.id === u.unitId)
                      return (
                        <tr key={u.id} className="hover:bg-surface-container-lowest transition-colors">
                          <td className="px-6 py-4 font-medium text-on-surface">{u.name}</td>
                          <td className="px-6 py-4 text-on-surface-variant">{u.username}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${roleColors[u.role] || roleColors.EMPLOYEE}`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-on-surface-variant">
                            {uUnit ? uUnit.name : 'Acesso Global'}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-on-surface hover:text-primary">
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-on-surface hover:text-error">
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

      <TabsContent value="units">
        <Card>
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle className="text-xl">Unidades (Clínicas)</CardTitle>
            <div className="flex w-full sm:w-auto items-center gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-on-surface-variant" />
                <Input 
                  placeholder="Buscar unidade..." 
                  className="pl-8" 
                  value={searchUnits}
                  onChange={(e) => setSearchUnits(e.target.value)}
                />
              </div>
              <CreateUnitDialog />
            </div>
          </CardHeader>
          <CardContent>
            {filteredUnits.length === 0 ? (
              <p className="text-sm text-on-surface-variant">Nenhuma unidade encontrada.</p>
            ) : (
              <div className="relative overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-surface-container-highest text-on-surface uppercase text-xs">
                    <tr>
                      <th className="px-6 py-3 font-semibold">Nome</th>
                      <th className="px-6 py-3 font-semibold">Data de Criação</th>
                      <th className="px-6 py-3 font-semibold text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container">
                    {filteredUnits.map((unit) => (
                      <tr key={unit.id} className="hover:bg-surface-container-lowest transition-colors">
                        <td className="px-6 py-4 font-medium text-on-surface">{unit.name}</td>
                        <td className="px-6 py-4 text-on-surface-variant">
                          {new Date(unit.createdAt).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-on-surface hover:text-primary">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-on-surface hover:text-error">
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
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle className="text-xl">Setores</CardTitle>
            <div className="flex w-full sm:w-auto items-center gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-on-surface-variant" />
                <Input 
                  placeholder="Buscar setor..." 
                  className="pl-8" 
                  value={searchSectors}
                  onChange={(e) => setSearchSectors(e.target.value)}
                />
              </div>
              <CreateSectorDialog units={units} activeUnitId={activeUnitId} />
            </div>
          </CardHeader>
          <CardContent>
            {filteredSectors.length === 0 ? (
              <p className="text-sm text-on-surface-variant">Nenhum setor encontrado.</p>
            ) : (
              <div className="relative overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-surface-container-highest text-on-surface uppercase text-xs">
                    <tr>
                      <th className="px-6 py-3 font-semibold">Nome</th>
                      <th className="px-6 py-3 font-semibold">Unidade</th>
                      <th className="px-6 py-3 font-semibold text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container">
                    {filteredSectors.map((sector) => {
                      const parentUnit = units.find(u => u.id === sector.unitId)
                      return (
                        <tr key={sector.id} className="hover:bg-surface-container-lowest transition-colors">
                          <td className="px-6 py-4 font-medium text-on-surface">{sector.name}</td>
                          <td className="px-6 py-4 text-on-surface-variant">
                            {parentUnit ? parentUnit.name : '—'}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-on-surface hover:text-primary">
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-on-surface hover:text-error">
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
    </Tabs>
  )
}
