import { api } from './api-client'

interface UpdateSectorRequest {
  name?: string
}

export async function updateSector(
  token: string,
  id: string,
  data: UpdateSectorRequest
) {
  await api.put(`sectors/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    json: data,
  })
}
