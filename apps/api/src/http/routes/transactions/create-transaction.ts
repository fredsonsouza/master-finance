import { randomUUID } from 'node:crypto'
import { auth } from '@/http/middlewares/auth'
import { logAction } from '@/lib/audit'
import { prisma } from '@/lib/prisma'
import { defineAbilityFor } from '@saas/auth'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { BadRequestError } from '../_errors/bad-request-error'
import { UnauthorizedError } from '../_errors/unauthorized-error'

export async function createTransaction(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(auth)
    .post(
      '/transactions',
      {
        schema: {
          tags: ['transactions'],
          summary: 'Create a new batch transaction',
          security: [{ bearerAuth: [] }],
          body: z.object({
            type: z.enum(['ENTRY', 'EXIT']),
            date: z.coerce.date(),
            unitId: z.uuid(),
            sectorId: z.uuid().nullable().optional(),
            items: z
              .array(
                z.object({
                  itemId: z.uuid(),
                  quantity: z.number().int().positive(),
                  value: z.number().nonnegative(),
                })
              )
              .min(1),
          }),
          response: {
            201: z.object({
              batchId: z.uuid(),
            }),
          },
        },
      },
      async (request, reply) => {
        const userId = await request.getCurrentUserId()
        const requestingUser = await prisma.user.findUnique({
          where: { id: userId },
        })

        if (!requestingUser) {
          throw new UnauthorizedError()
        }

        const ability = defineAbilityFor({
          id: requestingUser.id,
          role: requestingUser.role,
          unitId: requestingUser.unitId,
        } as any)

        const { type, date, unitId, sectorId, items } = request.body

        if (
          ability.cannot('create', { __typename: 'Transaction', unitId } as any)
        ) {
          throw new UnauthorizedError(
            'You are not allowed to create a transaction in this unit.'
          )
        }

        // Validate unit
        const unit = await prisma.unit.findUnique({ where: { id: unitId } })
        if (!unit) {
          throw new BadRequestError('Unit not found.')
        }

        const batchId = randomUUID()
        const monthString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

        // Group total requested quantities by itemId to prevent duplicate item overselling in a batch
        const requestedQuantitiesByItem = new Map<string, number>()
        for (const itemReq of items) {
          const current = requestedQuantitiesByItem.get(itemReq.itemId) || 0
          requestedQuantitiesByItem.set(itemReq.itemId, current + itemReq.quantity)
        }

        await prisma.$transaction(async (tx) => {
          // Resolve sector: ENTRY automatically goes to 'Estoque', EXIT requires specified sector
          let finalSectorId: string
          let sectorName = 'Estoque'

          if (type === 'ENTRY') {
            let estoqueSector = await tx.sector.findFirst({
              where: {
                name: {
                  equals: 'Estoque',
                  mode: 'insensitive',
                },
              },
            })

            if (!estoqueSector) {
              estoqueSector = await tx.sector.create({
                data: {
                  name: 'Estoque',
                },
              })
            }

            finalSectorId = estoqueSector.id
            sectorName = estoqueSector.name
          } else {
            if (!sectorId) {
              throw new BadRequestError('O setor é obrigatório para transações de saída.')
            }

            const sector = await tx.sector.findUnique({ where: { id: sectorId } })
            if (!sector) {
              throw new BadRequestError('Sector not found.')
            }

            finalSectorId = sector.id
            sectorName = sector.name
          }

          // Validate items exist
          const uniqueItemIds = Array.from(requestedQuantitiesByItem.keys())
          const dbItems = await tx.item.findMany({
            where: { id: { in: uniqueItemIds } },
          })

          if (dbItems.length !== uniqueItemIds.length) {
            throw new BadRequestError('One or more items not found.')
          }

          // Validate stock for EXIT transactions inside transaction lock
          if (type === 'EXIT') {
            for (const [itemId, requestedQty] of requestedQuantitiesByItem.entries()) {
              const pastTransactions = await tx.transaction.findMany({
                where: { itemId, unitId },
                select: { type: true, quantity: true },
              })

              const itemDb = dbItems.find((i) => i.id === itemId)
              let currentStock = itemDb?.quantity || 0
              for (const pastTx of pastTransactions) {
                if (pastTx.type === 'ENTRY') currentStock += pastTx.quantity
                else if (pastTx.type === 'EXIT') currentStock -= pastTx.quantity
              }

              if (requestedQty > currentStock) {
                throw new BadRequestError(
                  `Estoque insuficiente para o item ${itemDb?.name || itemId}. Estoque atual: ${currentStock}, Solicitado: ${requestedQty}`
                )
              }
            }
          }

          // Create transactions
          for (const itemReq of items) {
            await tx.transaction.create({
              data: {
                type,
                date,
                month: monthString,
                value: itemReq.value,
                quantity: itemReq.quantity,
                itemId: itemReq.itemId,
                unitId,
                sectorId: finalSectorId,
                userId,
                batchId,
              },
            })

            await tx.item.update({
              where: { id: itemReq.itemId },
              data: {
                value: itemReq.value,
              },
            })
          }

          const itemsDetails = items
            .map((itemReq) => {
              const itemDb = dbItems.find((i) => i.id === itemReq.itemId)
              return `${itemReq.quantity}x ${itemDb?.name || ''} (R$ ${itemReq.value.toFixed(2)}/un)`
            })
            .join(', ')

          await logAction({
            userId,
            action: 'CREATE',
            resource: 'TRANSACTION',
            resourceId: batchId,
            details: `Registrou movimentação de ${type === 'ENTRY' ? 'ENTRADA' : 'SAÍDA'} em lote na unidade ${unit.name} e setor ${sectorName}. Itens: ${itemsDetails}`,
            tx,
          })
        })

        return reply.status(201).send({ batchId })
      }
    )
}
