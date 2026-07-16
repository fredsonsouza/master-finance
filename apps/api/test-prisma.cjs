const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function test() {
  try {
    const collections = await prisma.collection.findMany({
      include: {
        collector: { select: { id: true, name: true } },
        unit: { select: { id: true, name: true } },
        user: { select: { id: true, name: true } },
      },
      orderBy: { requestDate: 'desc' },
    })
    console.log(JSON.stringify(collections, null, 2))
  } catch (err) {
    console.error(err)
  } finally {
    await prisma.$disconnect()
  }
}

test()
