# Authentication System Testing Guide

This document explains how to thoroughly test the authentication system in the LamontAI application.

## Testing Methods

We have several ways to test the authentication system:

1. **API-level Tests**: Tests the server-side authentication endpoints directly
2. **End-to-End Tests**: Tests the entire authentication flow through the browser using Puppeteer
3. **Browser Console Debug Utility**: A utility script for interactive debugging in the browser console

## Prerequisites

- Node.js 16+ installed
- npm 8+ installed
- Next.js development server running on port 3001

## 1. API-Level Tests

These tests call the authentication API endpoints directly to verify they work correctly.

```bash
# Run the API tests
npm run test:auth
```

This will:
- Register a new test user
- Check session persistence with the /me endpoint
- Test logout functionality
- Test login with the test user's credentials
- Verify authentication again after login

## 2. End-to-End Browser Tests

These tests use Puppeteer to automate a Chrome browser and test the entire authentication flow through the UI.

### On Windows

```powershell
# Run the E2E tests on Windows
.\run-e2e-tests.ps1
```

### On Linux/Mac

```bash
# Make the script executable
chmod +x run-e2e-tests.sh

# Run the tests
./run-e2e-tests.sh
```

The E2E tests will:
1. Install necessary Puppeteer dependencies if they're missing
2. Start the development server if it's not already running
3. Open a Chrome browser and automate the following:
   - Register a new test user
   - Login with the test user's credentials
   - Test session persistence
   - Test logout functionality
   - Examine browser storage and cookies
4. Take screenshots at each step (saved in `test-screenshots` directory)
5. Log detailed information about network requests, responses, and cookies

## 3. Browser Console Debug Utility

For interactive debugging, you can use the browser console utility:

1. Open the application in Chrome at `http://localhost:3001`
2. Open Chrome DevTools (F12 or right-click > Inspect)
3. Copy the entire contents of `auth-debug.js` file
4. Paste it into the Chrome DevTools console and press Enter

This will add an `authDebug` object to the window with various testing functions:

```javascript
// Check cookies
authDebug.checkCookies();

// Check local storage
authDebug.checkLocalStorage();

// Check session storage
authDebug.checkSessionStorage();

// Check if user is authenticated
authDebug.checkAuthStatus();

// Test login
authDebug.testLogin('test@example.com', 'password123');

// Test logout
authDebug.testLogout();

// Examine request headers
authDebug.examineRequestHeaders('/api/auth/me');

// Run all checks
authDebug.runChecks();
```

## Debugging Techniques

### Network Monitoring

Both the E2E tests and browser debug utility monitor network requests to authentication endpoints. Look for:

- Request headers (especially cookies and Authorization)
- Response status codes
- Response body (success/error messages)
- Set-Cookie headers in responses

### Cookie Inspection

The authentication system uses httpOnly cookies for security. To inspect these:

1. In Chrome DevTools, go to the Application tab
2. Select Cookies in the left sidebar
3. Look for the `token` cookie
4. Check its attributes (httpOnly, Secure, SameSite, Expiration)

### Common Issues

1. **Authentication not persisting**: Check if cookies are being properly set and sent with requests
2. **CORS issues**: Check for CORS errors in the console when accessing from different domains
3. **Missing token**: Verify the token cookie exists and has the correct attributes
4. **Session expiration**: Check if the token has expired prematurely

## Test Results

After running the tests, you'll see a summary of the results indicating whether each part of the authentication flow passed or failed.

A successful test suite will show:
- Registration: ✅ PASSED
- Login: ✅ PASSED
- Session Persistence: ✅ PASSED
- Logout: ✅ PASSED

## Troubleshooting

If any tests fail:

1. Check the terminal output for error messages
2. Review the screenshots in the `test-screenshots` directory
3. Look for any network request failures
4. Verify the server is running correctly
5. Check the browser console for any JavaScript errors

For more detailed debugging, use the browser console utility or add additional logging to the test scripts as needed. 