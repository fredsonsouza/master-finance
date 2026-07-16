import { api } from './api-client'

interface CreateUserRequest {
  name: string
  username: string
  password?: string
  role:
    | 'ADMIN'
    | 'MANAGER'
    | 'EMPLOYEE'
    | 'FINANCIAL'
    | 'SELLER'
    | 'COLLECTOR'
    | 'FISCAL'
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
