import { api } from './api-client'

interface CreateSectorRequest {
  name: string
  unitId: string
}

export async function createSector(token: string, data: CreateSectorRequest) {
  await api.post('sectors', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    json: data,
  })
}
