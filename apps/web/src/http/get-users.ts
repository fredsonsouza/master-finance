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
    | 'INVENTORY'
  unitId: string | null
  avatarUrl: string | null
}

export interface UserPagination {
  page: number
  perPage: number
  totalCount: number
  totalPages: number
}

interface GetUsersResponse {
  users: User[]
  pagination: UserPagination
}

export async function getUsers(
  token: string,
  unitId?: string | null,
  role?: string | null,
  search?: string | null,
  page?: number,
  perPage?: number
) {
  const searchParams: Record<string, string> = {}
  if (unitId) searchParams.unitId = unitId
  if (role) searchParams.role = role
  if (search) searchParams.search = search
  if (page) searchParams.page = String(page)
  if (perPage) searchParams.perPage = String(perPage)

  const result = await api
    .get('users', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      searchParams:
        Object.keys(searchParams).length > 0 ? searchParams : undefined,
      next: {
        tags: ['users'],
        revalidate: 0,
      },
    })
    .json<GetUsersResponse>()

  return result
}
