import { auth } from '@/auth/auth'
import { getLogs } from '@/http/get-logs'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { LogsContent } from './logs-content'

export const metadata: Metadata = {
  title: 'Logs de Auditoria - Master Admin',
  description: 'Rastreamento de ações administrativas de auditoria.',
}

export const dynamic = 'force-dynamic'

interface LogsPageProps {
  searchParams: Promise<{
    resource?: string
    action?: string
    search?: string
    startDate?: string
    endDate?: string
  }>
}

export default async function LogsPage({ searchParams }: LogsPageProps) {
  const { user, token } = await auth()
  const params = await searchParams

  if (user.role !== 'ADMIN') {
    redirect('/')
  }

  let logs: any[] = []
  try {
    const logsRes = await getLogs(token, {
      resource: params.resource,
      action: params.action,
      search: params.search,
      startDate: params.startDate,
      endDate: params.endDate,
    })
    logs = logsRes.logs
  } catch (err) {
    console.error('Failed to load audit logs:', err)
  }

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-3xl font-display font-bold text-primary">
          Logs de Auditoria
        </h1>
        <p className="text-on-surface-variant">
          Histórico completo de criação, edição e exclusão de dados do sistema.
        </p>
      </div>

      <LogsContent initialLogs={logs} />
    </div>
  )
}
