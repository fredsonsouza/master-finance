import { BadRequestError } from '@/http/routes/_errors/bad-request-error'
import type { FastifyError, FastifyInstance } from 'fastify'
import { ZodError, z } from 'zod'
import { ResourceNotFoundError } from './routes/_errors/resource-not-found-error'
import { UnauthorizedError } from './routes/_errors/unauthorized-error'

type FastifyErrorHandler = FastifyInstance['errorHandler']

export const errorHandler: FastifyErrorHandler = (error, request, reply) => {
  const fastifyError = error as FastifyError

  if (error instanceof ZodError) {
    return reply.status(400).send({
      message: 'Validation error',
      errors: z.flattenError(error).fieldErrors,
    })
  }

  if (fastifyError.code === 'FST_ERR_VALIDATION') {
    return reply.status(400).send({
      message: 'Validation error',
      errors: (error as any).validation,
    })
  }

  if (error instanceof BadRequestError) {
    return reply.status(400).send({
      message: error.message,
    })
  }

  if (error instanceof UnauthorizedError) {
    return reply.status(401).send({
      message: error.message,
    })
  }

  if (error instanceof ResourceNotFoundError) {
    return reply.status(404).send({
      message: error.message,
    })
  }

  if (fastifyError.statusCode) {
    return reply.status(fastifyError.statusCode).send({
      message: fastifyError.message,
    })
  }
  console.error(error)
  import('node:fs').then((fs) =>
    fs.writeFileSync(
      '/tmp/api-error.txt',
      `${String(error.stack || error.message)}\n${JSON.stringify(error, null, 2)}`
    )
  )
  // TODO: Send error to an external observability platform (e.g. Sentry, Datadog)
  reply
    .status(500)
    .send({ message: 'Internal server error', error: error.message })
}
