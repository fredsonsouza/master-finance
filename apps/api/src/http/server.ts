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

export const app = fastify().withTypeProvider<ZodTypeProvider>()

app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)
;(app.register(fastifySwagger, {
  openapi: {
    info: {
      title: 'Master Finance',
      description: 'Full-stack app with multi-tenant & RBAC',
      version: '1.0.0',
    },
  },
  transform: jsonSchemaTransform,
}),
  app.register(fastifySwaggerUi, {
    routePrefix: '/docs',
  }))

app.register(fastifyJwt, {
  secret: 'my-jwt-secret',
})

app.register(fastifyCors)

app.register(createAccount)
app.register(authenticateWithPassword)
app.register(getProfile)

if (process.env.NODE_ENV !== 'test') {
  app.listen({ port: 3131 }).then(() => {
    console.log('HTTP Server Running✅')
  })
}
