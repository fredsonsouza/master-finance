import { prisma } from '@/lib/prisma'
import { maskCpf } from '@/utils/employee-registration'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { ResourceNotFoundError } from '../_errors/resource-not-found-error'

export async function verifyEmployeeDocument(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    '/public/verify/:code',
    {
      schema: {
        tags: ['employee-requests'],
        summary:
          'Public endpoint to verify electronic signature and authenticity of HR documents via QR Code',
        params: z.object({
          code: z.string().min(4),
        }),
        response: {
          200: z.object({
            valid: z.boolean(),
            document: z.object({
              id: z.string().uuid(),
              verificationCode: z.string(),
              contentHash: z.string(),
              type: z.enum(['DECLARATION', 'WARNING', 'RECEIPT']),
              subtype: z.string(),
              title: z.string(),
              signedAt: z.date(),
              employee: z.object({
                fullName: z.string(),
                registrationNumber: z.string(),
                cpfMasked: z.string(),
                roleTitle: z.string(),
                employerName: z.string(),
                employerCnpj: z.string(),
              }),
              issuedBy: z.object({
                name: z.string(),
                role: z.string(),
              }),
            }),
          }),
        },
      },
    },
    async (request, reply) => {
      const normalizedCode = request.params.code.trim().toUpperCase()

      const doc = await prisma.employeeRequest.findUnique({
        where: {
          verificationCode: normalizedCode,
        },
        include: {
          employee: {
            select: {
              fullName: true,
              registrationNumber: true,
              cpf: true,
              roleTitle: true,
              employerName: true,
              employerCnpj: true,
            },
          },
          issuedBy: {
            select: {
              name: true,
              role: true,
            },
          },
        },
      })

      if (
        !doc ||
        doc.status !== 'COMPLETED' ||
        !doc.verificationCode ||
        !doc.contentHash ||
        !doc.signedAt
      ) {
        throw new ResourceNotFoundError(
          'Documento não encontrado ou código de verificação inválido.'
        )
      }

      return reply.status(200).send({
        valid: true,
        document: {
          id: doc.id,
          verificationCode: doc.verificationCode,
          contentHash: doc.contentHash,
          type: doc.type,
          subtype: doc.subtype,
          title: doc.title,
          signedAt: doc.signedAt,
          employee: {
            fullName: doc.employee.fullName,
            registrationNumber: doc.employee.registrationNumber,
            cpfMasked: maskCpf(doc.employee.cpf),
            roleTitle: doc.employee.roleTitle,
            employerName: doc.employee.employerName,
            employerCnpj: doc.employee.employerCnpj,
          },
          issuedBy: {
            name: doc.issuedBy?.name || 'Gestão de Recursos Humanos',
            role: doc.issuedBy?.role || 'HR',
          },
        },
      })
    }
  )
}
