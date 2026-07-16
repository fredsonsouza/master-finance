import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { PrismaClient } from '../../generated/prisma/client'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

let adapterSchema

if (process.env.DATABASE_URL) {
  const url = new URL(process.env.DATABASE_URL)
  const schema = url.searchParams.get('schema')
  if (schema) {
    adapterSchema = schema
  }
}

const adapter = new PrismaPg(pool, { schema: adapterSchema })

export const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'test' ? [] : ['query'],
})

export { pool }
