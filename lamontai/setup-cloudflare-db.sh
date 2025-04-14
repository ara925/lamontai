#!/bin/bash
# Setup script for Cloudflare database connection

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

CLOUDFLARE_DB_ID="715abbe3-5697-497b-8a6a-f4722632b741"

echo -e "${GREEN}Setting up Cloudflare database connection...${NC}\n"

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}Creating .env.local from .env.example...${NC}"
    cp .env.example .env.local
fi

# Get database connection details
echo -e "${YELLOW}Please enter your Cloudflare database connection details:${NC}"
echo -e "Your database ID is: ${GREEN}$CLOUDFLARE_DB_ID${NC}"
echo -e "(You can find this information in the Cloudflare dashboard under Database)"
echo ""

read -p "Database hostname (e.g. aws.neon.tech): " DB_HOSTNAME
read -p "Database name: " DB_NAME
read -p "Database username: " DB_USERNAME
read -sp "Database password: " DB_PASSWORD
echo ""

# Create the connection string
CONNECTION_STRING="postgresql://$DB_USERNAME:$DB_PASSWORD@$CLOUDFLARE_DB_ID.$DB_HOSTNAME:5432/$DB_NAME?sslmode=require"

# Update .env.local with the new connection string
sed -i'.bak' '/^DATABASE_URL=/d' .env.local
sed -i'.bak' '/^CLOUDFLARE_DB_ID=/d' .env.local
echo "" >> .env.local
echo "# Cloudflare Database connection" >> .env.local
echo "DATABASE_URL=$CONNECTION_STRING" >> .env.local
echo "CLOUDFLARE_DB_ID=$CLOUDFLARE_DB_ID" >> .env.local

echo -e "\n${GREEN}Database connection configured successfully!${NC}"
echo -e "${YELLOW}Your Cloudflare database connection has been added to .env.local${NC}"
echo ""

# Ask if the user wants to initialize the database
read -p "Do you want to initialize the database with required schema and seed data? (y/n): " INIT_DB
if [[ $INIT_DB == "y" || $INIT_DB == "Y" ]]; then
    echo -e "\n${YELLOW}Initializing database...${NC}"
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}Installing dependencies...${NC}"
        npm install
    fi
    
    # Run the initialization script
    echo -e "${YELLOW}Running database initialization script...${NC}"
    node scripts/init-cloudflare-db.js
    
    if [ $? -eq 0 ]; then
        echo -e "\n${GREEN}Database initialization complete!${NC}"
    else
        echo -e "\n${RED}Database initialization failed. Please check the errors above.${NC}"
    fi
else
    echo -e "\n${YELLOW}Skipping database initialization.${NC}"
    echo -e "${YELLOW}You can initialize the database later by running:${NC}"
    echo -e "  ${GREEN}node scripts/init-cloudflare-db.js${NC}"
fi

echo ""
echo -e "To test your database connection, run:"
echo -e "  ${GREEN}npm run dev${NC}"
echo ""
echo -e "If you want to test with Cloudflare compatibility mode:"
echo -e "  ${GREEN}NEXT_PUBLIC_DEPLOY_ENV=cloudflare npm run dev${NC}"
echo ""
echo -e "${RED}IMPORTANT: Make sure to add these secrets to your GitHub repository:${NC}"
echo -e "  DATABASE_URL_CLOUDFLARE"
echo -e "  DATABASE_URL_CLOUDFLARE_STAGING"
echo -e "Go to GitHub repository settings → Secrets and variables → Actions" 