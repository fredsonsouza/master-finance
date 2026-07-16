import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="bg-surface-container mb-2 h-8 w-48 animate-pulse rounded-md" />
          <div className="bg-surface-container h-4 w-72 animate-pulse rounded-md" />
        </div>
        <div className="bg-surface-container h-10 w-32 animate-pulse rounded-md" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Itens Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="bg-surface-container flex items-center gap-4 rounded-md p-4">
              <div className="bg-surface-container-high h-4 w-full animate-pulse rounded" />
            </div>
            <div className="bg-surface-container flex items-center gap-4 rounded-md p-4">
              <div className="bg-surface-container-high h-4 w-full animate-pulse rounded" />
            </div>
            <div className="bg-surface-container flex items-center gap-4 rounded-md p-4">
              <div className="bg-surface-container-high h-4 w-full animate-pulse rounded" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
