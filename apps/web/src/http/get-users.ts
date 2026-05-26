import { api } from './api-client'

export interface User {
  id: string
  name: string
  username: string
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE'
  unitId: string | null
  avatarUrl: string | null
}

interface GetUsersResponse {
  users: User[]
}

export async function getUsers(token: string) {
  const result = await api
    .get('users', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      next: {
        tags: ['users'],
      },
    })
    .json<GetUsersResponse>()

  return result
}
