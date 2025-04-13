# LamontAI Backend

The backend server for LamontAI, a platform for generating SEO-optimized content using AI.

## Tech Stack

- **Node.js** with **Express** for the API
- **TypeScript** for type safety
- **PostgreSQL** for the database
- **Sequelize** as the ORM
- **JWT** for authentication

## Prerequisites

- Node.js (v16+)
- npm (v7+)
- PostgreSQL (v12+)

## PostgreSQL Setup

Before running the application, you need to set up PostgreSQL:

1. **Install PostgreSQL** (if not already installed)

   Download from: https://www.postgresql.org/download/

2. **Create a new database and user**

   ```sql
   CREATE DATABASE lamontai;
   CREATE USER lamontai_user WITH ENCRYPTED PASSWORD 'your_secure_password';
   GRANT ALL PRIVILEGES ON DATABASE lamontai TO lamontai_user;
   ```

3. **Update environment variables**

   Copy `.env.example` to `.env` and update database credentials:

   ```
   DB_NAME=lamontai
   DB_USER=lamontai_user
   DB_PASSWORD=your_secure_password
   DB_HOST=localhost
   DB_PORT=5432
   ```

## Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd lamontai/backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   Make sure you have created a `.env` file based on `.env.example`

4. **Set up and seed the database**

   ```bash
   # Set up the database (creates tables)
   npm run setup-db
   
   # Alternative: Force recreate all tables (caution: deletes all data)
   npm run setup-db-force
   
   # Seed only (adds sample data)
   npm run seed
   ```

## Running the Application

### Development Mode

```bash
npm run dev
```

The server will start at `http://localhost:5000` (or the port specified in your `.env`).

### Production Mode

```bash
npm run build
npm start
```

## API Documentation

| Endpoint                    | Method | Description                           |
|-----------------------------|--------|---------------------------------------|
| `/api/auth/register`        | POST   | Register a new user                   |
| `/api/auth/login`           | POST   | Login and get JWT token               |
| `/api/auth/me`              | GET    | Get current user information          |
| `/api/articles`             | GET    | Get all articles (with pagination)    |
| `/api/articles/:id`         | GET    | Get article by ID                     |
| `/api/articles`             | POST   | Create a new article                  |
| `/api/articles/:id`         | PUT    | Update an article                     |
| `/api/articles/:id`         | DELETE | Delete an article                     |
| `/api/subscriptions`        | GET    | Get all subscription plans            |
| `/api/subscriptions/:id`    | GET    | Get subscription plan by ID           |
| `/api/subscriptions/subscribe` | POST | Subscribe to a plan                  |

## Database Models

- **User**: User accounts and authentication
- **Article**: Content articles created by users
- **Subscription**: Available subscription plans
- **UserSubscription**: Join table between users and their subscriptions

## License

[MIT](LICENSE) 