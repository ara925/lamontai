const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

async function main() {
  console.log('Seeding database...')

  // Create some plans
  const freePlan = await prisma.plan.upsert({
    where: { id: 'clk1f3b1l0000pkq6g5q9h8l1' },
    update: {},
    create: {
      id: 'clk1f3b1l0000pkq6g5q9h8l1',
      name: 'Free',
      price: 0,
      description: 'Basic plan for new users',
      features: 'Limited articles, Basic analytics'
    }
  })

  const proPlan = await prisma.plan.upsert({
    where: { id: 'clk1f3b1l0001pkq6dz5m8j4t' },
    update: {},
    create: {
      id: 'clk1f3b1l0001pkq6dz5m8j4t',
      name: 'Pro',
      price: 29.99,
      description: 'Professional plan for serious content creators',
      features: 'Unlimited articles, Advanced analytics, Priority support'
    }
  })

  console.log('Plans created:', { freePlan, proPlan })

  // Create a test user
  const hashedPassword = await hashPassword('password123')
  
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      name: 'Test User',
      email: 'test@example.com',
      password: hashedPassword,
      role: 'user',
      subscriptions: {
        create: {
          planId: freePlan.id,
          status: 'active',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        }
      },
      settings: {
        create: {
          theme: 'light',
          language: 'english',
          notifications: true
        }
      }
    }
  })

  console.log('User created:', user)
  
  // Create a content plan and articles
  const contentPlan = await prisma.contentPlan.create({
    data: {
      title: 'Sample Content Plan',
      description: 'This is a sample content plan',
      status: 'draft',
      userId: user.id
    }
  })
  
  // Create a sample article
  await prisma.article.create({
    data: {
      title: 'Getting Started with Content Creation',
      content: 'This is a sample article content. Replace with your own content.',
      status: 'draft',
      keywords: 'content creation, beginners, guide',
      metaDescription: 'A beginner\'s guide to content creation',
      userId: user.id,
      contentPlanId: contentPlan.id
    }
  })

  // Create admin user
  const adminPassword = await hashPassword('admin123')
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@example.com',
      password: adminPassword,
      role: 'admin',
      subscriptions: {
        create: {
          planId: proPlan.id,
          status: 'active',
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        }
      },
      settings: {
        create: {
          theme: 'dark',
          language: 'english',
          notifications: true
        }
      }
    }
  })

  console.log('Admin created:', admin)
  
  console.log('Database seeding completed')
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 