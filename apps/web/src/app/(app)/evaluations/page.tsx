import { auth } from '@/auth/auth'
import { getEvaluations } from '@/http/get-evaluations'
import { getUnits, type Unit } from '@/http/get-units'
import { getUsers, type User } from '@/http/get-users'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { EvaluationsContent } from './evaluations-content'

export const metadata: Metadata = {
  title: 'Meus Atendimentos - Master Admin',
  description: 'Acompanhe as avaliações de atendimento recebidas.',
}

export default async function EvaluationsPage() {
  const { user, token } = await auth()

  if (!['SELLER', 'ADMIN', 'MANAGER'].includes(user.role)) {
    redirect('/')
  }

  const isManagement = user.role === 'ADMIN' || user.role === 'MANAGER'

  let sellers: User[] = []
  let units: Unit[] = []

  const [{ evaluations, pagination, metrics, podium }] = await Promise.all([
    getEvaluations(token, { page: 1, perPage: 10 }),
    isManagement
      ? Promise.all([
          getUsers(token, null, 'SELLER')
            .then((res) => {
              sellers = res.users
            })
            .catch(() => {}),
          getUnits(token)
            .then((res) => {
              units = res.units
            })
            .catch(() => {}),
        ])
      : Promise.resolve([]),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-primary text-3xl font-bold">
          {user.role === 'SELLER' ? 'Meus Atendimentos' : 'Avaliações de Atendimento'}
        </h1>
        <p className="text-on-surface-variant">
          {user.role === 'SELLER'
            ? 'Acompanhe sua satisfação de atendimento e compartilhe seu QR Code.'
            : 'Gerencie a satisfação dos clientes e acompanhe o pódio de destaques da recepção por unidade.'}
        </p>
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
        }}
        sellers={sellers}
        units={units}
      />
    </div>
  )
}
