import type { Permission, Role } from '@/lib/permissions'
import { api } from './api-client'

export interface CreateUserRequest {
  name: string
  username: string
  password?: string
  role: Role
  permissions?: Permission[]
  unitId?: string | null
}

export async function createUser(token: string, data: CreateUserRequest) {
  await api.post('users/admin', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    json: data,
  })
}
