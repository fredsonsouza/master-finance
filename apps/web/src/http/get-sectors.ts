import { api } from './api-client'

export interface Sector {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

interface GetSectorsResponse {
  sectors: Sector[]
}

export async function getSectors(token: string) {
  const result = await api
    .get('sectors', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      next: {
        tags: ['sectors'],
      },
    })
    .json<GetSectorsResponse>()

  return result
}
