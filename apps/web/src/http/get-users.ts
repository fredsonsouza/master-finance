import { api } from './api-client'

export interface User {
  id: string
  name: string
  username: string
  role:
    | 'ADMIN'
    | 'MANAGER'
    | 'EMPLOYEE'
    | 'FINANCIAL'
    | 'SELLER'
    | 'COLLECTOR'
    | 'FISCAL'
  unitId: string | null
  avatarUrl: string | null
}

interface GetUsersResponse {
  users: User[]
}

export async function getUsers(
  token: string,
  unitId?: string | null,
  role?: string
) {
  const searchParams: Record<string, string> = {}
  if (unitId) searchParams.unitId = unitId
  if (role) searchParams.role = role

  const result = await api
    .get('users', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      searchParams:
        Object.keys(searchParams).length > 0 ? searchParams : undefined,
      next: {
        tags: ['users'],
      },
    })
    .json<GetUsersResponse>()

  return result
}
