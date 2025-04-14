import { PrismaClient } from '@prisma/client'
const bcrypt = require('bcryptjs')

// Use a different name to avoid conflicts with global declarations
const seedPrisma = new PrismaClient()

async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

async function main() {
  console.log('Seeding database...')

  // Create default users
  const hashedPassword = await hashPassword('Admin123!')
  
  const admin = await seedPrisma.user.upsert({
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

  const user = await seedPrisma.user.upsert({
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

  console.log('Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await seedPrisma.$disconnect()
  }) 