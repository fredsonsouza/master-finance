import { api } from './api-client'

interface UpdatePasswordRequest {
  password: string
}

export async function updatePassword(
  token: string,
  data: UpdatePasswordRequest
) {
  await api.patch('users/update-password', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    json: data,
  })
}
