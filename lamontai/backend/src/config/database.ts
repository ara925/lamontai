import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import { Options } from 'sequelize';

// Load environment variables
dotenv.config();

// Database configuration
const DB_NAME = process.env.DB_NAME || 'lamontai';
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASSWORD = process.env.DB_PASSWORD || 'postgres';
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = parseInt(process.env.DB_PORT || '5432', 10);
const DB_DIALECT = 'postgres';

// Sequelize configuration options
const config: Options = {
  host: DB_HOST,
  port: DB_PORT,
  dialect: DB_DIALECT,
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: false,
    paranoid: true // Soft deletes
  },
  dialectOptions: {
    // SSL configuration for production if needed
    ...(process.env.NODE_ENV === 'production' ? {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    } : {})
  }
};

// Create Sequelize instance
const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, config);

// Test database connection
export const testConnection = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    throw error;
  }
};

export default sequelize; 