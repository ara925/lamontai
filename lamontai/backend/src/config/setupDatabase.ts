import sequelize from './database';
import { syncDatabase } from '../models';
import { seedUsers, seedSubscriptions, seedArticles } from './seedData';

/**
 * Initialize the database with tables and seed data
 * @param force If true, drop existing tables before creating new ones
 */
export const setupDatabase = async (force = false): Promise<void> => {
  try {
    console.log('Starting database setup...');
    
    // Test connection
    await sequelize.authenticate();
    console.log('Database connection authenticated successfully.');
    
    // Sync database (create tables)
    await syncDatabase(force);
    console.log(`Database synced successfully${force ? ' (forced)' : ''}.`);
    
    // Seed initial data
    console.log('Seeding database with initial data...');
    await seedUsers();
    await seedSubscriptions();
    await seedArticles();
    console.log('Database seeded successfully.');
    
    console.log('Database setup completed.');
  } catch (error) {
    console.error('Error setting up database:', error);
    throw error;
  }
};

// Allow running as a standalone script
if (require.main === module) {
  const force = process.argv.includes('--force');
  setupDatabase(force)
    .then(() => {
      console.log('Database setup completed successfully.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Database setup failed:', error);
      process.exit(1);
    });
} 