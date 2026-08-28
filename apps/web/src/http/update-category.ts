import { api } from './api-client'

interface UpdateCategoryRequest {
  name: string
}

export async function updateCategory(
  token: string,
  categoryId: string,
  data: UpdateCategoryRequest
) {
  await api.put(`categories/${categoryId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    json: data,
  })
}
