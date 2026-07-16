import { api } from './api-client'

export interface ItemMetrics {
  currentStock: number
  lastPrice: number | null
}

export async function getItemMetrics(
  token: string,
  itemId: string,
  unitId?: string | null
) {
  const result = await api
    .get(`items/${itemId}/metrics`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      searchParams: unitId ? { unitId } : undefined,
    })
    .json<ItemMetrics>()

  return result
}
