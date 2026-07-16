import { api } from './api-client'

export interface Collection {
  id: string
  requestDate: string
  patientCode: string
  patientName: string
  exams: string[]
  reason: string
  pendingBy: string
  notifiedBy: string
  createdAt: string
  collector: { id: string; name: string }
  unit: { id: string; name: string }
  user: { id: string; name: string }
}

export async function getCollections(token: string, unitId?: string | null) {
  const result = await api
    .get('collections', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      searchParams: unitId ? { unitId } : undefined,
      next: {
        tags: ['collections'],
      },
    })
    .json<{ collections: Collection[] }>()

  return result
}

export async function createCollectionActionApi(
  token: string,
  data: {
    requestDate: string
    patientCode: string
    patientName: string
    exams: string[]
    reason: string
    collectorId: string
    pendingBy: string
    notifiedBy: string
    unitId: string
  }
) {
  await api.post('collections', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    json: data,
  })
}

export async function deleteCollectionActionApi(token: string, id: string) {
  await api.delete(`collections/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export async function updateCollectionActionApi(
  token: string,
  id: string,
  data: {
    requestDate: string
    patientCode: string
    patientName: string
    exams: string[]
    reason: string
    collectorId: string
    pendingBy: string
    notifiedBy: string
  }
) {
  await api.put(`collections/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    json: data,
  })
}
