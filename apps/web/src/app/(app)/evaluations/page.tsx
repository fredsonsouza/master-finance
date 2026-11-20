import { auth } from '@/auth/auth'
import { getEvaluations } from '@/http/get-evaluations'
import { type Unit, getUnits } from '@/http/get-units'
import { type User, getUsers } from '@/http/get-users'
import {
  getDefaultHomeRoute,
  hasAnyPermission,
  hasPermission,
} from '@/lib/permissions'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { EvaluationsContent } from './evaluations-content'
import { RegulationButton } from './regulation-button'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Avaliações de Atendimento - Master Admin',
  description: 'Acompanhe as avaliações de atendimento recebidas.',
}

export default async function EvaluationsPage() {
  const { user, token } = await auth()

  if (!hasAnyPermission(user, ['evaluations:manage', 'evaluations:receive'])) {
    redirect(getDefaultHomeRoute(user))
  }

  const canManageEvaluations = hasPermission(user, 'evaluations:manage')

  let sellers: User[] = []
  let units: Unit[] = []

  const [{ evaluations, pagination, metrics, podium }] = await Promise.all([
    getEvaluations(token, { page: 1, perPage: 10 }),
    canManageEvaluations
      ? Promise.all([
          getUsers(token, null, null, null, 1, 200, {
            departmentType: 'RECEPTION',
          })
            .then((res) => {
              sellers = res.users || []
            })
            .catch(() => {}),
          getUnits(token)
            .then((res) => {
              units = res.units || []
            })
            .catch(() => {}),
        ])
      : Promise.resolve(),
  ])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-primary text-3xl font-bold">
            Avaliações de Atendimento
          </h1>
          <p className="text-on-surface-variant">
            Gerencie a satisfação dos clientes e acompanhe o pódio de destaques
            da recepção por unidade.
          </p>
        </div>

        <RegulationButton />
      </div>

      <EvaluationsContent
        initialEvaluations={evaluations}
        initialMetrics={metrics}
        initialPagination={pagination}
        initialPodium={podium}
        currentUser={{
          id: user.id,
          name: user.name || user.username || '',
          role: user.role,
          canManageEvaluations,
        }}
        sellers={sellers}
        units={units}
      />
    </div>
  )
}
