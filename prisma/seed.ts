import { PrismaClient } from '@prisma/client'
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

async function main() {
  console.log('Seeding database...')

  // Create default users
  const hashedPassword = await hashPassword('Admin123!')
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      password: hashedPassword,
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  })

  const user = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      name: 'Test User',
      password: hashedPassword,
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  })

  // Create settings for users
  await prisma.settings.upsert({
    where: { userId: admin.id },
    update: {},
    create: {
      userId: admin.id,
      theme: 'light',
      language: 'english',
      notifications: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  })

  await prisma.settings.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      theme: 'light',
      language: 'english',
      notifications: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  })

  console.log('Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 