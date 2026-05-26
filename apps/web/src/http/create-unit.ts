import { api } from './api-client'

interface CreateUnitRequest {
  name: string
}

export async function createUnit(token: string, data: CreateUnitRequest) {
  await api.post('units', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    json: data,
  })
}
