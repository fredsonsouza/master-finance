import 'dotenv/config'
import { execSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { Client } from 'pg'
import type { Environment } from 'vitest/environments'

function generateDatabaseURL(schema: string) {
  if (!process.env.DATABASE_URL) {
    throw new Error('Please provide a DATABASE_URL environment variable.')
  }
  const url = new URL(process.env.DATABASE_URL)
  url.searchParams.set('schema', schema)
  return url.toString()
}

export default (<Environment>{
  name: 'prisma',
  transformMode: 'ssr',
  async setup(global) {
    const schema = randomUUID()
    const databaseURL = generateDatabaseURL(schema)

    process.env.DATABASE_URL = databaseURL
    global.process.env.DATABASE_URL = databaseURL

    execSync('npx prisma migrate deploy', { stdio: 'ignore' })

    return {
      async teardown() {
        const client = new Client({ connectionString: databaseURL })
        await client.connect()
        await client.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`)
        await client.end()
      },
    }
  },
})
