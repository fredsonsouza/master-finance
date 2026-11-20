import type { DepartmentType, Permission, Role } from '@/lib/permissions'
import { api } from './api-client'

export interface ProfileUser {
  id: string
  name: string | null
  username: string | null
  avatarUrl?: string | null
  forcePasswordChange: boolean
  role: Role
  permissions: Permission[]
  unitId: string | null
  unit?: {
    id: string
    name: string
  } | null
  employee?: {
    id: string
    registrationNumber: string
    status: 'ACTIVE' | 'INACTIVE'
    roleTitle: string
    department?: {
      id: string
      name: string
      type: DepartmentType
    } | null
  } | null
}

interface GetProfileResponse {
  user: ProfileUser
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
