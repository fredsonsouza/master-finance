import { api } from './api-client'
import type { Category } from './get-categories'

interface CreateCategoryRequest {
  name: string
}

interface CreateCategoryResponse {
  categoryId: string
  category: Category
}

export async function createCategory(
  token: string,
  data: CreateCategoryRequest
) {
  const result = await api
    .post('categories', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      json: data,
    })
    .json<CreateCategoryResponse>()

  return result
}
