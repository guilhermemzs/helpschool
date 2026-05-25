import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding...')

  await prisma.user.upsert({
    where: { email: 'admin@helpschool.com' },
    update: {},
    create: { name: 'Administrador', email: 'admin@helpschool.com', passwordHash: await bcrypt.hash('admin123', 10), role: 'ADMIN' },
  })
  await prisma.user.upsert({
    where: { email: 'coord@helpschool.com' },
    update: {},
    create: { name: 'Coordenação', email: 'coord@helpschool.com', passwordHash: await bcrypt.hash('coord123', 10), role: 'COORDINATOR' },
  })
  await prisma.user.upsert({
    where: { email: 'secretaria@helpschool.com' },
    update: {},
    create: { name: 'Secretaria', email: 'secretaria@helpschool.com', passwordHash: await bcrypt.hash('sec123', 10), role: 'SECRETARY' },
  })

  console.log('✅ Seed completo!')
  console.log('   admin@helpschool.com / admin123')
  console.log('   coord@helpschool.com / coord123')
  console.log('   secretaria@helpschool.com / sec123')
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
