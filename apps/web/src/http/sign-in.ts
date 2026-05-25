import { api } from './api-client'

interface SingInRequest {
  username: string
  password: string
}
interface SingInResponse {
  token: string
}

export async function signIn({ username, password }: SingInRequest) {
  const result = await api
    .post('/sessions/password', {
      json: {
        username,
        password,
      },
    })
    .json<SingInResponse>()

  return result
}
