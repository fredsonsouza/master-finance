import { prisma } from './prisma'

export async function logAction({
  userId,
  action,
  resource,
  resourceId,
  details,
  tx,
}: {
  userId: string
  action: 'CREATE' | 'UPDATE' | 'DELETE'
  resource:
    | 'USER'
    | 'UNIT'
    | 'SECTOR'
    | 'ITEM'
    | 'TRANSACTION'
    | 'CASH_CLOSURE'
    | 'COLLECTION'
    | 'AUTH'
    | 'HR_REPORT'
  resourceId?: string
  details: string
  tx?: any
}) {
  try {
    const client = tx || prisma
    await client.auditLog.create({
      data: {
        userId,
        action,
        resource,
        resourceId,
        details,
      },
    })
  } catch (error) {
    console.error('Failed to create audit log:', error)
  }
}
