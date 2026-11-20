export type Role = 'ADMIN' | 'EMPLOYEE'

export type DepartmentType = 'GENERAL' | 'RECEPTION' | 'COLLECTION'

export const PERMISSIONS = [
  'scope:all_units',
  'dashboard:view',
  'reports:view',
  'transactions:manage',
  'items:manage',
  'cash_closures:create',
  'cash_closures:manage',
  'collections:execute',
  'collections:manage',
  'evaluations:receive',
  'evaluations:manage',
  'employees:manage',
  'hr_reports:manage',
  'users:manage',
  'settings:structure',
  'logs:view',
] as const

export type Permission = (typeof PERMISSIONS)[number]

export const PRIVILEGED_PERMISSIONS: readonly Permission[] = [
  'users:manage',
  'settings:structure',
  'logs:view',
]

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Administrador',
  EMPLOYEE: 'Colaborador',
}

export const DEPARTMENT_TYPE_LABELS: Record<
  DepartmentType,
  { label: string; badge: string; description: string }
> = {
  GENERAL: {
    label: 'Geral',
    badge: 'Geral',
    description: 'Departamentos administrativos, RH, Financeiro, Estoque, etc.',
  },
  RECEPTION: {
    label: 'Recepção / Atendimento',
    badge: 'Recepção (Avaliações)',
    description:
      'Colaboradores aparecem automaticamente no dropdown de Avaliações de Atendimento e QR Code.',
  },
  COLLECTION: {
    label: 'Coleta Laboratorial',
    badge: 'Coleta (Recoletas)',
    description:
      'Colaboradores aparecem automaticamente no dropdown de Coletadores em Recoletas.',
  },
}

export interface PermissionDefinition {
  key: Permission
  label: string
  description: string
}

export interface PermissionGroup {
  id: string
  label: string
  description: string
  permissions: PermissionDefinition[]
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    id: 'scope',
    label: 'Escopo de Unidades',
    description:
      'Controla se o colaborador atua apenas na unidade vinculada ou em todas as unidades da clínica.',
    permissions: [
      {
        key: 'scope:all_units',
        label: 'Acesso a todas as unidades',
        description:
          'Permite alternar e visualizar dados de todas as unidades (Matriz, MHM, Santa Maria).',
      },
    ],
  },
  {
    id: 'analytics',
    label: 'Painel e Relatórios',
    description: 'Indicadores gerais e relatórios executivos.',
    permissions: [
      {
        key: 'dashboard:view',
        label: 'Visualizar Dashboard',
        description: 'Acessar gráficos de fluxo diário e resumos da operação.',
      },
      {
        key: 'reports:view',
        label: 'Relatórios Executivos',
        description:
          'Acessar relatórios gerenciais consolidados e exportações.',
      },
    ],
  },
  {
    id: 'inventory',
    label: 'Estoque e Movimentações',
    description: 'Controle de entradas, saídas e catálogo de insumos.',
    permissions: [
      {
        key: 'transactions:manage',
        label: 'Movimentações de Estoque',
        description:
          'Registrar e consultar entradas e saídas (restrito à unidade se sem escopo global).',
      },
      {
        key: 'items:manage',
        label: 'Catálogo de Itens e Categorias',
        description: 'Cadastrar, editar e remover insumos e categorias.',
      },
    ],
  },
  {
    id: 'financial',
    label: 'Financeiro (Fechamento de Caixa)',
    description: 'Lançamento e auditoria de fechamentos de caixa.',
    permissions: [
      {
        key: 'cash_closures:create',
        label: 'Lançar Fechamento de Caixa',
        description: 'Abrir e registrar fechamentos de caixa da unidade.',
      },
      {
        key: 'cash_closures:manage',
        label: 'Auditar e Gerenciar Caixas',
        description:
          'Aprovar, fechar, editar e excluir caixas de qualquer operador.',
      },
    ],
  },
  {
    id: 'operations',
    label: 'Operações (Recoletas e Avaliações)',
    description:
      'Gestão de recoletas laboratoriais e avaliações de atendimento.',
    permissions: [
      {
        key: 'collections:execute',
        label: 'Visualizar Próprias Recoletas',
        description:
          'Consultar recoletas atribuídas ao colaborador ou unidade.',
      },
      {
        key: 'collections:manage',
        label: 'Gerenciar Recoletas (Fiscal)',
        description:
          'Registrar, editar, excluir e emitir relatórios de recoletas.',
      },
      {
        key: 'evaluations:receive',
        label: 'Receber Avaliações de Atendimento',
        description:
          'Habilita QR Code / link público de avaliação e consulta das próprias notas.',
      },
      {
        key: 'evaluations:manage',
        label: 'Gerenciar Avaliações',
        description:
          'Visualizar ranking, moderar, editar e excluir avaliações de todos.',
      },
    ],
  },
  {
    id: 'hr',
    label: 'Recursos Humanos',
    description:
      'Quadro de colaboradores, documentos e relatórios de atividades.',
    permissions: [
      {
        key: 'employees:manage',
        label: 'Quadro de Colaboradores e Documentos',
        description:
          'Gerenciar fichas de colaboradores, departamentos do RH, declarações, advertências e solicitações.',
      },
      {
        key: 'hr_reports:manage',
        label: 'Gerenciar Relatórios de Atividades',
        description:
          'Consultar e gerenciar relatórios enviados por todos os colaboradores.',
      },
    ],
  },
  {
    id: 'admin',
    label: 'Administração do Sistema',
    description: 'Gestão de usuários, estrutura da clínica e auditoria.',
    permissions: [
      {
        key: 'users:manage',
        label: 'Gerenciar Usuários e Permissões',
        description: 'Criar, editar e configurar acessos dos colaboradores.',
      },
      {
        key: 'settings:structure',
        label: 'Unidades, Setores de Estoque e Departamentos',
        description:
          'Gerenciar unidades, setores exclusivos do estoque, categorias e departamentos.',
      },
      {
        key: 'logs:view',
        label: 'Logs de Auditoria',
        description: 'Visualizar histórico completo de ações do sistema.',
      },
    ],
  },
]

export interface PermissionPreset {
  id: string
  label: string
  description: string
  permissions: Permission[]
}

export const PERMISSION_PRESETS: PermissionPreset[] = [
  {
    id: 'basic',
    label: 'Básico',
    description: 'Apenas solicitações de documentos e relatório próprio.',
    permissions: [],
  },
  {
    id: 'reception',
    label: 'Recepção / Caixa',
    description: 'Fechamento de caixa da unidade + Avaliações.',
    permissions: ['cash_closures:create', 'evaluations:receive'],
  },
  {
    id: 'collector',
    label: 'Coletador',
    description: 'Visualização das próprias recoletas.',
    permissions: ['collections:execute'],
  },
  {
    id: 'fiscal',
    label: 'Fiscal de Coleta',
    description: 'Gestão de recoletas em todas as unidades.',
    permissions: ['scope:all_units', 'collections:manage'],
  },
  {
    id: 'unit_inventory',
    label: 'Estoque (Unidade)',
    description: 'Movimentação de estoque apenas na própria unidade.',
    permissions: ['dashboard:view', 'transactions:manage'],
  },
  {
    id: 'global_inventory',
    label: 'Estoque (Geral)',
    description: 'Estoque, catálogo e setores em todas as unidades.',
    permissions: [
      'scope:all_units',
      'dashboard:view',
      'transactions:manage',
      'items:manage',
      'settings:structure',
    ],
  },
  {
    id: 'financial',
    label: 'Financeiro',
    description: 'Auditoria de caixas e dashboard global.',
    permissions: ['scope:all_units', 'dashboard:view', 'cash_closures:manage'],
  },
  {
    id: 'hr',
    label: 'RH',
    description:
      'Colaboradores, documentos, avaliações, relatórios e usuários.',
    permissions: [
      'scope:all_units',
      'dashboard:view',
      'employees:manage',
      'hr_reports:manage',
      'evaluations:manage',
      'users:manage',
    ],
  },
  {
    id: 'manager',
    label: 'Gerência',
    description: 'Acesso gerencial amplo em todas as unidades.',
    permissions: [
      'scope:all_units',
      'dashboard:view',
      'reports:view',
      'transactions:manage',
      'items:manage',
      'cash_closures:manage',
      'collections:manage',
      'evaluations:manage',
      'employees:manage',
      'hr_reports:manage',
      'settings:structure',
    ],
  },
]

export interface PermissionSubjectUser {
  role: Role | string
  permissions?: readonly (Permission | string)[] | null
}

export function hasPermission(
  user: PermissionSubjectUser | null | undefined,
  permission: Permission
): boolean {
  if (!user) return false
  if (user.role === 'ADMIN') return true
  return (
    Array.isArray(user.permissions) && user.permissions.includes(permission)
  )
}

export function hasAnyPermission(
  user: PermissionSubjectUser | null | undefined,
  required: readonly Permission[]
): boolean {
  if (!user) return false
  if (user.role === 'ADMIN') return true
  if (!Array.isArray(user.permissions)) return false
  return required.some((perm) => user.permissions?.includes(perm))
}

export function getDefaultHomeRoute(
  user: PermissionSubjectUser | null | undefined
): string {
  if (!user) return '/auth/sign-in'
  if (user.role === 'ADMIN') return '/'

  if (hasPermission(user, 'dashboard:view')) return '/'
  if (hasPermission(user, 'transactions:manage')) return '/transactions'
  if (
    hasPermission(user, 'cash_closures:manage') ||
    hasPermission(user, 'cash_closures:create')
  ) {
    return '/cash-closures'
  }
  if (
    hasPermission(user, 'collections:manage') ||
    hasPermission(user, 'collections:execute')
  ) {
    return '/collections'
  }
  if (hasPermission(user, 'employees:manage')) return '/employees'
  if (
    hasPermission(user, 'evaluations:manage') ||
    hasPermission(user, 'evaluations:receive')
  ) {
    return '/evaluations'
  }
  if (hasPermission(user, 'hr_reports:manage')) return '/hr-reports'
  if (hasPermission(user, 'reports:view')) return '/reports'
  if (hasPermission(user, 'items:manage')) return '/items'
  if (
    hasPermission(user, 'users:manage') ||
    hasPermission(user, 'settings:structure')
  ) {
    return '/settings'
  }

  return '/employees/requests'
}

export function getPermissionLabel(key: string): string {
  for (const group of PERMISSION_GROUPS) {
    const found = group.permissions.find((p) => p.key === key)
    if (found) return found.label
  }
  return key
}
