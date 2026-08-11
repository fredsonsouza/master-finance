import 'dotenv/config'
import fastifyCors from '@fastify/cors'
import fastifyJwt from '@fastify/jwt'
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUi from '@fastify/swagger-ui'
import fastify from 'fastify'
import {
  type ZodTypeProvider,
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'
import { authenticateWithPassword } from './routes/auth/authenticate-with-password'
import { createAccount } from './routes/auth/create-account'
import { getProfile } from './routes/auth/get-profile'
import { resetPassword } from './routes/auth/reset-password'
import { updatePassword } from './routes/auth/update-password'
import { updateProfile } from './routes/auth/update-profile'
import { createItem } from './routes/items/create-item'
import { deleteItem } from './routes/items/delete-item'
import { getItem } from './routes/items/get-item'
import { getItemMetrics } from './routes/items/get-item-metrics'
import { getItems } from './routes/items/get-items'
import { updateItem } from './routes/items/update-item'
import { createSector } from './routes/sectors/create-sector'
import { deleteSector } from './routes/sectors/delete-sector'
import { getSector } from './routes/sectors/get-sector'
import { getSectors } from './routes/sectors/get-sectors'
import { updateSector } from './routes/sectors/update-sector'
import { createTransaction } from './routes/transactions/create-transaction'
import { deleteTransaction } from './routes/transactions/delete-transaction'
import { getTransaction } from './routes/transactions/get-transaction'
import { getTransactions } from './routes/transactions/get-transactions'
import { updateTransaction } from './routes/transactions/update-transaction'
import { createUnit } from './routes/units/create-unit'
import { deleteUnit } from './routes/units/delete-unit'
import { getUnit } from './routes/units/get-unit'
import { getUnits } from './routes/units/get-units'
import { updateUnit } from './routes/units/update-unit'
import { createUser } from './routes/users/create-user'
import { deleteUser } from './routes/users/delete-user'
import { getUser } from './routes/users/get-user'
import { getUsers } from './routes/users/get-users'
import { updateUser } from './routes/users/update-user'

import { getCollectionsReports } from './routes/metrics/get-collections-reports'
import { getDailyFlow } from './routes/metrics/get-daily-flow'
import { getDashboardMetrics } from './routes/metrics/get-dashboard-metrics'
import { getExecutiveReports } from './routes/metrics/get-executive-reports'
import { getSummary } from './routes/metrics/get-summary'
import { getTopItems } from './routes/metrics/get-top-items'

import { changeCashClosureStatus } from './routes/cash-closures/change-cash-closure-status'
import { createCashClosure } from './routes/cash-closures/create-cash-closure'
import { deleteCashClosure } from './routes/cash-closures/delete-cash-closure'
import { getCashClosures } from './routes/cash-closures/get-cash-closures'
import { updateCashClosure } from './routes/cash-closures/update-cash-closure'

import { createCollection } from './routes/collections/create-collection'
import { deleteCollection } from './routes/collections/delete-collection'
import { getCollections } from './routes/collections/get-collections'
import { updateCollection } from './routes/collections/update-collection'
import { getLogs } from './routes/logs/get-logs'

import { createEvaluation } from './routes/evaluations/create-evaluation'
import { getEvaluations } from './routes/evaluations/get-evaluations'
import { getPublicSeller } from './routes/evaluations/get-public-seller'

import { env } from '@saas/env'
import { errorHandler } from './error-handle'

export const app = fastify().withTypeProvider<ZodTypeProvider>()

app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)

app.setErrorHandler(errorHandler)
app.register(fastifySwagger, {
  openapi: {
    info: {
      title: 'Master Admin',
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
  })

app.register(fastifyJwt, {
  secret: env.JWT_SECRET,
})

app.register(fastifyCors)

app.register(createAccount)
app.register(authenticateWithPassword)
app.register(getProfile)
app.register(resetPassword)
app.register(updatePassword)
app.register(updateProfile)

app.register(getUsers)
app.register(getUser)
app.register(updateUser)
app.register(deleteUser)
app.register(createUser)

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

app.register(createItem)
app.register(getItems)
app.register(getItem)
app.register(getItemMetrics)
app.register(updateItem)
app.register(deleteItem)

app.register(createTransaction)
app.register(getTransactions)
app.register(getTransaction)
app.register(updateTransaction)
app.register(deleteTransaction)

app.register(getSummary)
app.register(getDailyFlow)
app.register(getTopItems)
app.register(getDashboardMetrics)
app.register(getExecutiveReports)
app.register(getCollectionsReports)

app.register(createCashClosure)
app.register(getCashClosures)
app.register(updateCashClosure)
app.register(deleteCashClosure)
app.register(changeCashClosureStatus)

app.register(createCollection)
app.register(getCollections)
app.register(updateCollection)
app.register(deleteCollection)
app.register(getLogs)

app.register(createEvaluation)
app.register(getPublicSeller)
app.register(getEvaluations)

if (process.env.NODE_ENV !== 'test') {
  app.listen({ port: env.SERVER_PORT, host: '0.0.0.0' }).then(() => {
    console.log('HTTP Server Running✅')
  })
}
