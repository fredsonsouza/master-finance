import { api } from './api-client'

interface GetProfileResponse {
  user: {
    id: string
    name: string | null
    username: string | null
    role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE'
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
