import { auth } from '@/auth/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function DashboardPage() {
  const { user } = await auth()

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-display font-bold text-primary">
        Olá, {user.name || user.username}
      </h1>
      <p className="text-on-surface-variant">
        Bem-vindo de volta ao Master Finance.
      </p>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Placeholder cards para a Fase 4 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Saldo Atual</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-on-surface">R$ 0,00</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Entradas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-success">R$ 0,00</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Saídas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-error">R$ 0,00</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
