import { auth } from '@/auth/auth'
import { getItems } from '@/http/get-items'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CreateItemDialog } from './create-item-dialog'

export default async function ItemsPage() {
  const { token } = await auth()
  const { items } = await getItems(token)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-primary">Catálogo</h1>
          <p className="text-on-surface-variant">
            Gerencie os itens e procedimentos da sua unidade.
          </p>
        </div>
        <CreateItemDialog />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Itens Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center py-8 text-on-surface-variant">
              Nenhum item no catálogo.
            </div>
          ) : (
            <div className="relative overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-container-highest text-on-surface uppercase text-xs">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Nome</th>
                    <th className="px-6 py-3 font-semibold">Descrição</th>
                    <th className="px-6 py-3 font-semibold text-right">Data de Cadastro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-surface-container-lowest transition-colors">
                      <td className="px-6 py-4 font-medium">{item.name}</td>
                      <td className="px-6 py-4 text-on-surface-variant">
                        {item.description || '-'}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
