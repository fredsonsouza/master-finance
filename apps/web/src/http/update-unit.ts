import { api } from './api-client'

interface UpdateUnitRequest {
  name?: string
}

export async function updateUnit(
  token: string,
  id: string,
  data: UpdateUnitRequest
) {
  await api.put(`units/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    json: data,
  })
}
