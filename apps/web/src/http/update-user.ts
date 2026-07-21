import { api } from './api-client'

interface UpdateUserRequest {
  name?: string
  role?:
    | 'ADMIN'
    | 'MANAGER'
    | 'EMPLOYEE'
    | 'FINANCIAL'
    | 'SELLER'
    | 'COLLECTOR'
    | 'FISCAL'
    | 'INVENTORY'
  unitId?: string | null
}

export async function updateUser(
  token: string,
  id: string,
  data: UpdateUserRequest
) {
  await api.put(`users/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    json: data,
  })
}
