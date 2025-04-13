#!/bin/bash

# Start Docker containers
echo "Starting Docker containers..."
docker-compose up -d

# Wait for database to be ready
echo "Waiting for database to be ready..."
sleep 10

# Run database migrations using Prisma
echo "Running database migrations..."
npx prisma migrate dev

# Seed the database
echo "Seeding the database..."
npx prisma db seed

echo "Database setup complete!" 