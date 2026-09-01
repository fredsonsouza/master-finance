import { api } from './api-client'

interface ResetPasswordRequest {
  password?: string
}

interface ResetPasswordResponse {
  temporaryPassword: string
}

export async function resetPassword(
  token: string,
  userId: string,
  data?: ResetPasswordRequest
) {
  const response = await api
    .patch(`users/${userId}/reset-password`, {
      headers: { Authorization: `Bearer ${token}` },
      json: data || {},
    })
    .json<ResetPasswordResponse>()

  return response
}
