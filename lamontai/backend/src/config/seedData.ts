import { User, Subscription, Article, sequelize } from '../models';
import bcrypt from 'bcrypt';

/**
 * Seed users into the database
 */
export const seedUsers = async (): Promise<void> => {
  try {
    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@lamontai.com',
      password: adminPassword,
      role: 'admin',
      isActive: true
    });
    
    console.log('Admin user created:', admin.email);
    
    // Create regular user
    const userPassword = await bcrypt.hash('password123', 10);
    const user = await User.create({
      name: 'Test User',
      email: 'user@lamontai.com',
      password: userPassword,
      role: 'user',
      isActive: true
    });
    
    console.log('Test user created:', user.email);
    
    return;
  } catch (error) {
    console.error('Error seeding users:', error);
    throw error;
  }
};

/**
 * Seed subscription plans into the database
 */
export const seedSubscriptions = async (): Promise<void> => {
  try {
    // Create subscription plans
    const subscriptions = await Subscription.bulkCreate([
      {
        name: 'Free Plan',
        description: 'Basic plan with limited features',
        price: 0,
        billingCycle: 'monthly',
        features: [
          '5 articles per month',
          'Basic SEO optimization',
          'Standard support'
        ],
        isActive: true,
        articleLimit: 5
      },
      {
        name: 'Pro Plan',
        description: 'Advanced features for serious content creators',
        price: 49.99,
        billingCycle: 'monthly',
        features: [
          '25 articles per month',
          'Advanced SEO optimization',
          'Priority support',
          'Keyword research',
          'Content analytics'
        ],
        isActive: true,
        articleLimit: 25
      },
      {
        name: 'Enterprise Plan',
        description: 'Full-featured plan for businesses',
        price: 99.99,
        billingCycle: 'monthly',
        features: [
          'Unlimited articles',
          'Premium SEO optimization',
          'Dedicated support',
          'Advanced keyword research',
          'Comprehensive analytics',
          'Team collaboration',
          'Custom integrations'
        ],
        isActive: true,
        articleLimit: 0 // Unlimited
      }
    ]);
    
    console.log(`${subscriptions.length} subscription plans created`);
    
    return;
  } catch (error) {
    console.error('Error seeding subscriptions:', error);
    throw error;
  }
};

/**
 * Seed sample articles into the database
 */
export const seedArticles = async (): Promise<void> => {
  try {
    // Get the test user to associate articles with
    const user = await User.findOne({ where: { email: 'user@lamontai.com' } });
    
    if (!user) {
      console.error('Test user not found. Please seed users first.');
      return;
    }
    
    // Create sample articles for the test user
    const articles = await Article.bulkCreate([
      {
        title: 'Getting Started with Lamont.ai',
        content: 'This is an AI-generated article about getting started with Lamont.ai...',
        slug: 'getting-started-with-lamontai',
        summary: 'Learn how to effectively use Lamont.ai to create SEO-optimized content.',
        keywords: ['Lamont.ai', 'AI content', 'getting started'],
        metaTitle: 'Getting Started with Lamont.ai - A Complete Guide',
        metaDescription: 'Learn how to effectively use Lamont.ai to create SEO-optimized content that ranks on Google.',
        status: 'published',
        publishedAt: new Date(),
        authorId: user.id
      },
      {
        title: 'SEO Best Practices in 2023',
        content: 'This is an AI-generated article about SEO best practices...',
        slug: 'seo-best-practices-2023',
        summary: 'Stay ahead of the competition with these SEO best practices for 2023.',
        keywords: ['SEO', 'best practices', '2023', 'search engine optimization'],
        metaTitle: 'SEO Best Practices in 2023 - Stay Ahead of the Competition',
        metaDescription: 'Learn the latest SEO best practices in 2023 to stay ahead of your competition and rank higher on Google.',
        status: 'draft',
        publishedAt: null,
        authorId: user.id
      }
    ]);
    
    console.log(`${articles.length} sample articles created`);
    
    return;
  } catch (error) {
    console.error('Error seeding articles:', error);
    throw error;
  }
};

/**
 * Seed the entire database with initial data
 */
export const seedDatabase = async (): Promise<void> => {
  try {
    // Sync database (force true will drop tables and recreate)
    await sequelize.sync({ force: true });
    console.log('Database synced successfully');
    
    // Seed all data types
    await seedUsers();
    await seedSubscriptions();
    await seedArticles();
    
    console.log('Database seeded successfully!');
  } catch (error: any) {
    console.error('Error seeding database:', error);
    throw error;
  }
};

// You can run this file directly to seed the database
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('Database seeding completed successfully');
      process.exit(0);
    })
    .catch((error: any) => {
      console.error('Error seeding database:', error);
      process.exit(1);
    });
} 