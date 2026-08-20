import { api } from './api-client'

export interface Category {
  id: string
  name: string
  createdAt: string
  updatedAt: string
}

interface GetCategoriesResponse {
  categories: Category[]
}

export async function getCategories(token: string) {
  const result = await api
    .get('categories', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      next: {
        tags: ['categories'],
      },
    })
    .json<GetCategoriesResponse>()

  return result
}
