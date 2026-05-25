import 'dotenv/config'
import fastifyCors from '@fastify/cors'
import fastifyJwt from '@fastify/jwt'
import fastify from 'fastify'
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
} from 'fastify-type-provider-zod'
import { createAccount } from './routes/auth/create-account'
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUi from '@fastify/swagger-ui'
import { authenticateWithPassword } from './routes/auth/authenticate-with-password'
import { getProfile } from './routes/auth/get-profile'
import { resetPassword } from './routes/auth/reset-password'
import { updatePassword } from './routes/auth/update-password'
import { getUsers } from './routes/users/get-users'
import { getUser } from './routes/users/get-user'
import { updateUser } from './routes/users/update-user'
import { deleteUser } from './routes/users/delete-user'
import { createUnit } from './routes/units/create-unit'
import { getUnits } from './routes/units/get-units'
import { getUnit } from './routes/units/get-unit'
import { updateUnit } from './routes/units/update-unit'
import { deleteUnit } from './routes/units/delete-unit'
import { createSector } from './routes/sectors/create-sector'
import { getSectors } from './routes/sectors/get-sectors'
import { getSector } from './routes/sectors/get-sector'
import { updateSector } from './routes/sectors/update-sector'
import { deleteSector } from './routes/sectors/delete-sector'
import { errorHandler } from './error-handle'
import { env } from '@saas/env'

export const app = fastify().withTypeProvider<ZodTypeProvider>()

app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)

app.setErrorHandler(errorHandler)

;(app.register(fastifySwagger, {
  openapi: {
    info: {
      title: 'Master Finance',
      description: 'Full-stack app with multi-tenant & RBAC',
      version: '1.0.0',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  transform: jsonSchemaTransform,
}),
  app.register(fastifySwaggerUi, {
    routePrefix: '/docs',
  }))

app.register(fastifyJwt, {
  secret: env.JWT_SECRET,
})

app.register(fastifyCors)

app.register(createAccount)
app.register(authenticateWithPassword)
app.register(getProfile)
app.register(resetPassword)
app.register(updatePassword)

app.register(getUsers)
app.register(getUser)
app.register(updateUser)
app.register(deleteUser)

app.register(createUnit)
app.register(getUnits)
app.register(getUnit)
app.register(updateUnit)
app.register(deleteUnit)

app.register(createSector)
app.register(getSectors)
app.register(getSector)
app.register(updateSector)
app.register(deleteSector)

if (process.env.NODE_ENV !== 'test') {
  app.listen({ port: env.SERVER_PORT }).then(() => {
    console.log('HTTP Server Running✅')
  })
}
