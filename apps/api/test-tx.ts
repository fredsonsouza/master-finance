import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const txs = await prisma.transaction.findMany({
    include: {
      item: {
        include: {
          sector: true,
        },
      },
    },
  })
  console.log(JSON.stringify(txs, null, 2))
}
main()
