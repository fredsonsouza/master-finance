import type { Permission, Role } from '@/lib/permissions'
import { api } from './api-client'

export interface UpdateUserRequest {
  name?: string
  password?: string
  role?: Role
  permissions?: Permission[]
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
