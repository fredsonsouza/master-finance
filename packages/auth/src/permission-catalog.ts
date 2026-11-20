import z from 'zod'
import type { Role } from './roles'

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

export const permissionSchema = z.enum(PERMISSIONS)

export type Permission = z.infer<typeof permissionSchema>

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
      'Define se o colaborador atua somente na sua unidade ou em todas as unidades da clínica.',
    permissions: [
      {
        key: 'scope:all_units',
        label: 'Acesso a todas as unidades',
        description:
          'Permite alternar e visualizar dados de todas as unidades (Matriz, MHM, Santa Maria). Sem esta opção, o acesso fica restrito à unidade vinculada.',
      },
    ],
  },
  {
    id: 'analytics',
    label: 'Painel e Relatórios',
    description: 'Indicadores operacionais e relatórios executivos.',
    permissions: [
      {
        key: 'dashboard:view',
        label: 'Visualizar Dashboard',
        description:
          'Acessar indicadores gerais, gráficos de fluxo diário e resumos.',
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
          'Registrar e consultar entradas e saídas de insumos (respeita o escopo de unidade).',
      },
      {
        key: 'items:manage',
        label: 'Catálogo de Itens e Categorias',
        description:
          'Cadastrar, editar e remover insumos e categorias de estoque.',
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
        description:
          'Abrir e registrar fechamentos de caixa da unidade (recepção/caixa).',
      },
      {
        key: 'cash_closures:manage',
        label: 'Auditar e Gerenciar Caixas',
        description:
          'Aprovar, fechar, editar e excluir fechamentos de caixa de qualquer operador.',
      },
    ],
  },
  {
    id: 'operations',
    label: 'Operações (Recoletas e Avaliações)',
    description:
      'Acompanhamento de recoletas laboratoriais e avaliações de atendimento.',
    permissions: [
      {
        key: 'collections:execute',
        label: 'Visualizar Próprias Recoletas',
        description:
          'Consultar recoletas atribuídas ao colaborador ou à sua unidade.',
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
          'Habilita o colaborador a receber avaliações de clientes (QR Code / link público) e ver suas notas.',
      },
      {
        key: 'evaluations:manage',
        label: 'Gerenciar Avaliações',
        description:
          'Visualizar, moderar, editar e excluir avaliações de todos os atendentes.',
      },
    ],
  },
  {
    id: 'hr',
    label: 'Recursos Humanos',
    description:
      'Quadro de colaboradores, emissão de documentos e relatórios de atividades.',
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
          'Consultar, revisar e gerenciar relatórios de atividades enviados por todos os colaboradores.',
      },
    ],
  },
  {
    id: 'admin',
    label: 'Administração do Sistema',
    description: 'Gestão de acessos, cadastros estruturais e auditoria.',
    permissions: [
      {
        key: 'users:manage',
        label: 'Gerenciar Usuários e Permissões',
        description:
          'Criar, editar, redefinir senhas e configurar permissões de colaboradores.',
      },
      {
        key: 'settings:structure',
        label: 'Unidades, Setores de Estoque e Departamentos',
        description:
          'Cadastrar e editar unidades da clínica, setores de estoque, categorias e departamentos.',
      },
      {
        key: 'logs:view',
        label: 'Logs de Auditoria',
        description:
          'Visualizar histórico completo de ações registradas no sistema.',
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
    label: 'Básico (Sem módulos)',
    description:
      'Apenas solicitações de documentos e relatório de atividades próprio.',
    permissions: [],
  },
  {
    id: 'reception',
    label: 'Recepção / Caixa',
    description: 'Fechamento de caixa da unidade e avaliações de atendimento.',
    permissions: ['cash_closures:create', 'evaluations:receive'],
  },
  {
    id: 'collector',
    label: 'Coletador',
    description: 'Visualização das próprias recoletas na unidade.',
    permissions: ['collections:execute'],
  },
  {
    id: 'fiscal',
    label: 'Fiscal de Coleta',
    description: 'Gestão completa de recoletas em todas as unidades.',
    permissions: ['scope:all_units', 'collections:manage'],
  },
  {
    id: 'unit_inventory',
    label: 'Estoque (Unidade)',
    description: 'Movimentação de estoque restrita à própria unidade.',
    permissions: ['dashboard:view', 'transactions:manage'],
  },
  {
    id: 'global_inventory',
    label: 'Estoque (Geral)',
    description: 'Gestão de estoque, itens e setores em todas as unidades.',
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
    description: 'Auditoria de caixas e dashboard em todas as unidades.',
    permissions: ['scope:all_units', 'dashboard:view', 'cash_closures:manage'],
  },
  {
    id: 'hr',
    label: 'Recursos Humanos',
    description:
      'Quadro de colaboradores, documentos, relatórios de atividades, avaliações e usuários.',
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
    description:
      'Visão ampla de todas as unidades, relatórios executivos e módulos operacionais.',
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

export const PRIVILEGED_PERMISSIONS: readonly Permission[] = [
  'users:manage',
  'settings:structure',
  'logs:view',
]

/**
 * Prevents privilege escalation:
 * - Only ADMIN can assign the ADMIN role.
 * - Non-ADMIN users (e.g., HR with `users:manage`) can grant operational
 *   permissions when onboarding employees, but CANNOT grant privileged
 *   system-administration permissions they do not possess themselves.
 */
export function canGrantAccess(
  actor: PermissionSubjectUser,
  targetRole: Role,
  targetPermissions: readonly Permission[]
): { allowed: true } | { allowed: false; reason: string } {
  if (actor.role === 'ADMIN') {
    return { allowed: true }
  }

  if (targetRole === 'ADMIN') {
    return {
      allowed: false,
      reason:
        'Apenas administradores podem atribuir o perfil de Administrador.',
    }
  }

  const actorPerms = new Set(actor.permissions ?? [])
  const forbidden = targetPermissions.filter(
    (p) => PRIVILEGED_PERMISSIONS.includes(p) && !actorPerms.has(p)
  )

  if (forbidden.length > 0) {
    return {
      allowed: false,
      reason: `Você não pode conceder permissões administrativas que não possui: ${forbidden.join(', ')}.`,
    }
  }

  return { allowed: true }
}

/**
 * Returns the best initial route for a user after login based on their permissions.
 */
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
