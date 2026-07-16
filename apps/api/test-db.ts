import { Pool } from 'pg'
const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function main() {
  const res = await pool.query(
    'SELECT t.id, t."itemId", i.name as item_name, i.sector_id, s.name as sector_name FROM transactions t JOIN items i ON t."itemId" = i.id LEFT JOIN sectors s ON i.sector_id = s.id LIMIT 10'
  )
  console.log(JSON.stringify(res.rows, null, 2))
  process.exit(0)
}
main()
