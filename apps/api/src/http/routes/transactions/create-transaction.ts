import { auth } from '@/http/middlewares/auth'
import { logAction } from '@/lib/audit'
import { prisma } from '@/lib/prisma'
import { defineAbilityFor } from '@saas/auth'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { BadRequestError } from '../_errors/bad-request-error'
import { UnauthorizedError } from '../_errors/unauthorized-error'
import { randomUUID } from 'node:crypto'

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

        // Resolve sector: ENTRY automatically goes to 'Estoque', EXIT requires specified sector
        let finalSectorId: string
        let sectorName = 'Estoque'

        if (type === 'ENTRY') {
          let estoqueSector = await prisma.sector.findFirst({
            where: {
              name: {
                equals: 'Estoque',
                mode: 'insensitive',
              },
            },
          })

          if (!estoqueSector) {
            estoqueSector = await prisma.sector.create({
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

          const sector = await prisma.sector.findUnique({ where: { id: sectorId } })
          if (!sector) {
            throw new BadRequestError('Sector not found.')
          }

          finalSectorId = sector.id
          sectorName = sector.name
        }

        // Validate items exist
        const dbItems = await prisma.item.findMany({
          where: { id: { in: items.map((i) => i.itemId) } },
        })

        if (dbItems.length !== Array.from(new Set(items.map((i) => i.itemId))).length) {
          throw new BadRequestError('One or more items not found.')
        }

        // Validate stock for EXIT transactions
        if (type === 'EXIT') {
          for (const itemReq of items) {
            const pastTransactions = await prisma.transaction.findMany({
              where: { itemId: itemReq.itemId, unitId },
              select: { type: true, quantity: true },
            })

            const itemDb = dbItems.find((i) => i.id === itemReq.itemId)
            let currentStock = itemDb?.quantity || 0
            for (const tx of pastTransactions) {
              if (tx.type === 'ENTRY') currentStock += tx.quantity
              else if (tx.type === 'EXIT') currentStock -= tx.quantity
            }

            if (itemReq.quantity > currentStock) {
              throw new BadRequestError(
                `Estoque insuficiente para o item ${itemDb?.name || itemReq.itemId}.`
              )
            }
          }
        }

        const batchId = randomUUID()
        const monthString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

        await prisma.$transaction(
          items.map((itemReq) => {
            return prisma.transaction.create({
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
          })
        )

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
        })

        return reply.status(201).send({ batchId })
      }
    )
}
