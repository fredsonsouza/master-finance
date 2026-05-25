'use server'

import { signIn } from '@/http/sign-in'

export async function SignIn(data: FormData) {
  const { username, password } = Object.fromEntries(data)

  const result = await signIn({
    username: String(username),
    password: String(password),
  })

  console.log({
    result,
  })
}
