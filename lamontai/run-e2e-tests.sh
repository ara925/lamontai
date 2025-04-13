#!/bin/bash

echo -e "\033[32mChecking for puppeteer and related dependencies...\033[0m"

# Install the required dependencies if they don't exist
if ! npm list puppeteer-extra | grep -q puppeteer-extra; then
    echo -e "\033[33mInstalling puppeteer packages...\033[0m"
    npm install --save-dev puppeteer puppeteer-extra puppeteer-extra-plugin-stealth
else
    echo -e "\033[32mPuppeteer packages already installed.\033[0m"
fi

# Ensure the server is running
server_running=false
if curl -s -I http://localhost:3001 | grep -q "200 OK"; then
    server_running=true
fi

if [ "$server_running" = false ]; then
    echo -e "\033[33mStarting Next.js development server...\033[0m"
    npm run dev &
    
    # Wait for server to start
    echo -e "\033[33mWaiting for server to start (15 seconds)...\033[0m"
    sleep 15
fi

# Run the tests
echo -e "\033[32mRunning E2E authentication tests...\033[0m"
node --experimental-modules e2e-auth-test.js

echo -e "\033[32mE2E tests completed.\033[0m" 