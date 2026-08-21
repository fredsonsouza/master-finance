import { api } from './api-client'

interface GetProfileResponse {
  user: {
    id: string
    name: string | null
    username: string | null
    avatarUrl?: string | null
    forcePasswordChange: boolean
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
    unit?: {
      id: string
      name: string
    } | null
  }
}

export async function getProfile(token: string) {
  const result = await api
    .get('profile', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .json<GetProfileResponse>()

  return result
}
