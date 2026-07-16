import { prisma } from './prisma'

export async function logAction({
  userId,
  action,
  resource,
  resourceId,
  details,
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
  resourceId?: string
  details: string
}) {
  try {
    await prisma.auditLog.create({
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
