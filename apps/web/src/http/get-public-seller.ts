import { api } from './api-client'

export interface PublicSeller {
  id: string
  name: string
  avatarUrl: string | null
  unit: {
    id: string
    name: string
  } | null
}

interface GetPublicSellerResponse {
  seller: PublicSeller
}

export async function getPublicSeller(sellerId: string) {
  const result = await api
    .get(`evaluations/public/seller/${sellerId}`, {
      next: {
        revalidate: 60, // Cache for 1 minute
      },
    })
    .json<GetPublicSellerResponse>()

  return result
}
