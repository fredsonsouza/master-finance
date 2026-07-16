import { api } from './api-client'

interface UpdateProfileRequest {
  name: string
}

export async function updateProfile(token: string, data: UpdateProfileRequest) {
  await api.put('profile', {
    headers: { Authorization: `Bearer ${token}` },
    json: data,
  })
}
