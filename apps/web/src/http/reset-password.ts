import { api } from './api-client'

interface ResetPasswordRequest {
  password?: string
}

export async function resetPassword(
  token: string,
  userId: string,
  data?: ResetPasswordRequest
) {
  await api.patch(`users/${userId}/reset-password`, {
    headers: { Authorization: `Bearer ${token}` },
    json: data || {},
  })
}
