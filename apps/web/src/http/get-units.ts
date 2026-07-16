import { api } from './api-client'

export interface Unit {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

interface GetUnitsResponse {
  units: Unit[]
}

export async function getUnits(token: string) {
  const result = await api
    .get('units', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      next: {
        tags: ['units'],
      },
    })
    .json<GetUnitsResponse>()

  return result
}
