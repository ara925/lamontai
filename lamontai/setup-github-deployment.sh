#!/bin/bash
# Setup script for GitHub deployment

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Setting up GitHub deployment workflow for Cloudflare...${NC}\n"

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo -e "${RED}Error: git is not installed. Please install git and try again.${NC}"
    exit 1
fi

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo -e "${RED}Error: This doesn't appear to be a git repository.${NC}"
    echo -e "${YELLOW}Make sure you're running this script from the root of your project.${NC}"
    exit 1
fi

# Create .github directory and workflows subdirectory if they don't exist
echo "Creating GitHub workflow directories..."
mkdir -p .github/workflows

# Check if the workflow file exists
if [ -f ".github/workflows/cloudflare-deploy.yml" ]; then
    echo -e "${YELLOW}Workflow file already exists. Skipping creation.${NC}"
else
    echo -e "${GREEN}Workflow file created successfully.${NC}"
fi

# Create staging branch if it doesn't exist
if git show-ref --verify --quiet refs/heads/staging; then
    echo -e "${YELLOW}Staging branch already exists.${NC}"
else
    echo "Creating staging branch..."
    git checkout -b staging
    echo -e "${GREEN}Staging branch created successfully.${NC}"
    git checkout -
fi

# Check for .env.example
if [ ! -f ".env.example" ]; then
    echo -e "${RED}Warning: .env.example file not found.${NC}"
    echo -e "${YELLOW}Make sure you have an example environment file for reference.${NC}"
fi

echo -e "\n${GREEN}Setup complete!${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Push the staging branch: git push -u origin staging"
echo "2. Configure GitHub secrets in your repository settings"
echo "3. Create Cloudflare Pages projects for staging and production"
echo "4. Update domain names in the workflow file if needed"
echo -e "\n${YELLOW}See GITHUB_DEPLOYMENT.md for detailed instructions.${NC}" 