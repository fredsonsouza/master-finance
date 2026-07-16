import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { hash } from 'bcryptjs'
import { PrismaClient } from '../generated/prisma/client'

// --- FIX: Definir process corretamente para evitar erros de tipagem ---
// declare const process: any

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function seed() {
  console.log('Cleaning database...')
  // // Deletar em ordem para respeitar constraints
  // await prisma.auditLog.deleteMany()
  // await prisma.ranking.deleteMany()
  // await prisma.workout.deleteMany()
  // await prisma.raceResult.deleteMany()
  // await prisma.race.deleteMany()
  // await prisma.invoice.deleteMany()
  // await prisma.member.deleteMany()
  // await prisma.invite.deleteMany()
  // await prisma.account.deleteMany()
  // await prisma.token.deleteMany()
  // await prisma.athleteProfile.deleteMany()
  // await prisma.club.deleteMany()
  // await prisma.user.deleteMany()

  const password_hash = await hash('#admin.entrar1', 6)

  console.log('Creating super admin...')
  await prisma.user.create({
    data: {
      name: 'Fredson',
      username: 'fredson',
      password_hash,
      avatarUrl: 'https://github.com/fredsonsouza.png',
      role: 'ADMIN',
    },
  })

  console.log('Seed complete!')
}

seed()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
