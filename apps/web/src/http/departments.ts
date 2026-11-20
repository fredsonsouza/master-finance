import type { DepartmentType } from '@/lib/permissions'
import { api } from './api-client'

export interface Department {
  id: string
  name: string
  type: DepartmentType
  employeesCount: number
  createdAt: string
  updatedAt: string
}

export async function getDepartments(token: string) {
  return api
    .get('departments', {
      headers: { Authorization: `Bearer ${token}` },
      next: { tags: ['departments'], revalidate: 0 },
    })
    .json<{ departments: Department[] }>()
}

export async function createDepartmentApi(
  token: string,
  data: { name: string; type: DepartmentType }
) {
  return api
    .post('departments', {
      headers: { Authorization: `Bearer ${token}` },
      json: data,
    })
    .json<{ departmentId: string }>()
}

export async function updateDepartmentApi(
  token: string,
  departmentId: string,
  data: { name?: string; type?: DepartmentType }
) {
  await api.put(`departments/${departmentId}`, {
    headers: { Authorization: `Bearer ${token}` },
    json: data,
  })
}

export async function deleteDepartmentApi(token: string, departmentId: string) {
  await api.delete(`departments/${departmentId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
}
