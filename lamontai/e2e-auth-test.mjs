// End-to-end authentication test using Puppeteer
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Add stealth plugin to avoid detection
puppeteer.use(StealthPlugin());

// Test constants
const BASE_URL = 'http://localhost:3001';
const TEST_EMAIL = `e2e_test_${Date.now()}@example.com`;
const TEST_PASSWORD = 'TestPassword123!';
const TEST_NAME = 'E2E Test User';

// Screenshot directory
const SCREENSHOT_DIR = path.join(__dirname, 'test-screenshots');

// Ensure screenshot directory exists
async function ensureScreenshotDir() {
  try {
    await fs.mkdir(SCREENSHOT_DIR, { recursive: true });
    console.log(`Screenshots will be saved to: ${SCREENSHOT_DIR}`);
  } catch (err) {
    console.error('Failed to create screenshot directory:', err);
  }
}

// Save screenshot
async function takeScreenshot(page, name) {
  const screenshotPath = path.join(SCREENSHOT_DIR, `${name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Screenshot saved: ${screenshotPath}`);
}

// Helper function to monitor network requests
function setupNetworkMonitoring(page) {
  page.on('request', request => {
    if (request.url().includes('/api/auth/')) {
      console.log(`🌐 Request: ${request.method()} ${request.url()}`);
    }
  });
  
  page.on('response', async response => {
    if (response.url().includes('/api/auth/')) {
      console.log(`🌐 Response: ${response.status()} ${response.url()}`);
      try {
        const contentType = response.headers()['content-type'] || '';
        if (contentType.includes('application/json')) {
          const json = await response.json();
          console.log('Response body:', JSON.stringify(json, null, 2));
        }
      } catch (error) {
        console.log('Could not parse response as JSON');
      }
    }
  });
}

// Helper function to print all cookies
async function printCookies(page) {
  const cookies = await page.cookies();
  console.log('\n🍪 Current cookies:');
  cookies.forEach(cookie => {
    console.log(`- ${cookie.name}: ${cookie.value.substring(0, 20)}${cookie.value.length > 20 ? '...' : ''} (httpOnly: ${cookie.httpOnly})`);
  });
  console.log('\n');
}

// Test registration process
async function testRegistration(browser) {
  console.log('\n🔹 TESTING REGISTRATION FLOW 🔹');
  const page = await browser.newPage();
  
  // Set up console log monitoring
  page.on('console', msg => console.log(`Console [${msg.type()}]: ${msg.text()}`));
  
  // Set up network monitoring
  setupNetworkMonitoring(page);
  
  try {
    // Navigate to registration page
    console.log('Navigating to registration page...');
    await page.goto(`${BASE_URL}/auth/register`, { waitUntil: 'networkidle2' });
    await takeScreenshot(page, '01-registration-page');
    
    // Fill out the registration form
    console.log('Filling registration form...');
    await page.type('input[name="name"]', TEST_NAME);
    await page.type('input[name="email"]', TEST_EMAIL);
    await page.type('input[name="password"]', TEST_PASSWORD);
    await page.type('input[name="confirmPassword"]', TEST_PASSWORD);
    await takeScreenshot(page, '02-registration-form-filled');
    
    // Submit the form
    console.log('Submitting registration form...');
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 })
    ]);
    
    // Check for successful registration
    await takeScreenshot(page, '03-after-registration');
    
    // Print cookies
    await printCookies(page);
    
    // Check current URL to see if we're redirected to dashboard
    const currentUrl = page.url();
    const isSuccess = currentUrl.includes('/dashboard');
    console.log(`Registration result: ${isSuccess ? 'SUCCESS ✅' : 'FAILURE ❌'}`);
    console.log(`Current URL: ${currentUrl}`);
    
    if (!isSuccess) {
      // Check for error messages
      const errorText = await page.evaluate(() => {
        const errorEl = document.querySelector('.bg-red-50') || document.querySelector('[role="alert"]');
        return errorEl ? errorEl.textContent : null;
      });
      
      if (errorText) {
        console.log(`Error message: ${errorText.trim()}`);
      }
    }
    
    return isSuccess;
  } catch (error) {
    console.error('Error during registration test:', error);
    await takeScreenshot(page, 'registration-error');
    return false;
  } finally {
    await page.close();
  }
}

// Test login process
async function testLogin(browser) {
  console.log('\n🔹 TESTING LOGIN FLOW 🔹');
  const page = await browser.newPage();
  
  // Set up console log monitoring
  page.on('console', msg => console.log(`Console [${msg.type()}]: ${msg.text()}`));
  
  // Set up network monitoring
  setupNetworkMonitoring(page);
  
  try {
    // Navigate to login page
    console.log('Navigating to login page...');
    await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'networkidle2' });
    await takeScreenshot(page, '04-login-page');
    
    // Fill out the login form
    console.log('Filling login form...');
    await page.type('input[name="email"]', TEST_EMAIL);
    await page.type('input[name="password"]', TEST_PASSWORD);
    await takeScreenshot(page, '05-login-form-filled');
    
    // Submit the form
    console.log('Submitting login form...');
    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 })
    ]);
    
    // Check for successful login
    await takeScreenshot(page, '06-after-login');
    
    // Print cookies
    await printCookies(page);
    
    // Check current URL to see if we're redirected to dashboard
    const currentUrl = page.url();
    const isSuccess = currentUrl.includes('/dashboard');
    console.log(`Login result: ${isSuccess ? 'SUCCESS ✅' : 'FAILURE ❌'}`);
    console.log(`Current URL: ${currentUrl}`);
    
    if (!isSuccess) {
      // Check for error messages
      const errorText = await page.evaluate(() => {
        const errorEl = document.querySelector('.bg-red-50') || document.querySelector('[role="alert"]');
        return errorEl ? errorEl.textContent : null;
      });
      
      if (errorText) {
        console.log(`Error message: ${errorText.trim()}`);
      }
    }
    
    return { page, isSuccess };
  } catch (error) {
    console.error('Error during login test:', error);
    await takeScreenshot(page, 'login-error');
    return { page: null, isSuccess: false };
  }
}

// Test session persistence
async function testSessionPersistence(browser, loggedInPage) {
  console.log('\n🔹 TESTING SESSION PERSISTENCE 🔹');
  
  try {
    if (!loggedInPage) {
      console.log('No logged in page provided. Skipping test.');
      return false;
    }
    
    // Navigate to the /me API endpoint to check authentication
    console.log('Checking authentication status via /api/auth/me...');
    
    // Use the fetch API from within the page
    const authStatus = await loggedInPage.evaluate(async () => {
      try {
        const response = await fetch('/api/auth/me', { 
          method: 'GET',
          credentials: 'include'
        });
        
        return {
          status: response.status,
          data: await response.json()
        };
      } catch (error) {
        return { status: 500, error: error.toString() };
      }
    });
    
    console.log('Authentication status:', JSON.stringify(authStatus, null, 2));
    
    const isAuthenticated = authStatus.status === 200 && authStatus.data.success;
    console.log(`Session persistence test: ${isAuthenticated ? 'SUCCESS ✅' : 'FAILURE ❌'}`);
    
    // Access a protected page directly
    console.log('Accessing dashboard directly...');
    await loggedInPage.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle2' });
    await takeScreenshot(loggedInPage, '07-dashboard-direct-access');
    
    // Check if we're still on the dashboard or redirected to login
    const currentUrl = loggedInPage.url();
    const isAccessible = currentUrl.includes('/dashboard');
    console.log(`Direct dashboard access: ${isAccessible ? 'SUCCESS ✅' : 'FAILURE ❌'}`);
    
    return isAuthenticated && isAccessible;
  } catch (error) {
    console.error('Error during session persistence test:', error);
    return false;
  }
}

// Test logout process
async function testLogout(browser, loggedInPage) {
  console.log('\n🔹 TESTING LOGOUT FLOW 🔹');
  
  try {
    if (!loggedInPage) {
      console.log('No logged in page provided. Skipping test.');
      return false;
    }
    
    // Navigate to dashboard to ensure we're logged in
    console.log('Navigating to dashboard...');
    await loggedInPage.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle2' });
    
    // Find and click logout button/link
    console.log('Looking for logout button/link...');
    
    // First attempt - Try to find logout text in links
    let logoutButton = await loggedInPage.$('a:not([href=""]):not([href="#"]):not([href="/"]):contains("logout")', { 
      visible: true 
    });
    
    // Second attempt - Try to find specific button or link with logout-related classes or data attributes
    if (!logoutButton) {
      logoutButton = await loggedInPage.$('[data-testid="logout-button"], .logout-button, button:contains("logout")', { 
        visible: true 
      });
    }
    
    // If still not found, try by evaluating the page content
    if (!logoutButton) {
      logoutButton = await loggedInPage.evaluateHandle(() => {
        // Try to find elements with 'logout' in their text content
        const elements = Array.from(document.querySelectorAll('a, button'));
        const logoutElement = elements.find(el => 
          el.textContent?.toLowerCase().includes('logout') || 
          el.textContent?.toLowerCase().includes('sign out')
        );
        return logoutElement;
      });
    }
    
    if (!logoutButton) {
      console.log('Could not find logout button. Taking screenshot and trying programmatic logout...');
      await takeScreenshot(loggedInPage, '08-dashboard-no-logout-button');
      
      // Try to log out programmatically by calling the logout API directly
      console.log('Attempting programmatic logout via fetch...');
      await loggedInPage.evaluate(async () => {
        try {
          await fetch('/api/auth/logout', { 
            method: 'POST',
            credentials: 'include'
          });
          return true;
        } catch (error) {
          console.error('Error during programmatic logout:', error);
          return false;
        }
      });
      
      // Refresh the page to see if we've been logged out
      await loggedInPage.reload({ waitUntil: 'networkidle2' });
    } else {
      console.log('Logout button found. Clicking to log out...');
      await takeScreenshot(loggedInPage, '08-before-logout');
      
      // Click logout and wait for navigation
      await Promise.all([
        logoutButton.click(),
        loggedInPage.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 })
      ]);
    }
    
    // Check if we've been redirected to login page
    await takeScreenshot(loggedInPage, '09-after-logout');
    const currentUrl = loggedInPage.url();
    const isLoggedOut = currentUrl.includes('/login') || currentUrl.includes('/auth');
    
    // Print cookies after logout
    await printCookies(loggedInPage);
    
    console.log(`Logout result: ${isLoggedOut ? 'SUCCESS ✅' : 'FAILURE ❌'}`);
    console.log(`Current URL after logout attempt: ${currentUrl}`);
    
    // Try to access a protected route after logout
    console.log('Attempting to access dashboard after logout...');
    await loggedInPage.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle2' });
    await takeScreenshot(loggedInPage, '10-dashboard-after-logout');
    
    // Check if redirected to login
    const protectedUrl = loggedInPage.url();
    const isProtected = protectedUrl.includes('/login') || protectedUrl.includes('/auth');
    console.log(`Protected route redirect after logout: ${isProtected ? 'SUCCESS ✅' : 'FAILURE ❌'}`);
    
    return isLoggedOut && isProtected;
  } catch (error) {
    console.error('Error during logout test:', error);
    await takeScreenshot(loggedInPage, 'logout-error');
    return false;
  } finally {
    await loggedInPage.close();
  }
}

// Examine local storage and cookies
async function examineStorageAndCookies(browser) {
  console.log('\n🔹 EXAMINING STORAGE AND COOKIES 🔹');
  const page = await browser.newPage();
  
  try {
    // Navigate to login page
    await page.goto(`${BASE_URL}/auth/login`, { waitUntil: 'networkidle2' });
    
    // Check cookies
    const cookies = await page.cookies();
    console.log('Cookies:');
    cookies.forEach(cookie => {
      console.log(`- ${cookie.name}: ${cookie.value.substring(0, 20)}${cookie.value.length > 20 ? '...' : ''}`);
      console.log(`  Domain: ${cookie.domain}, Path: ${cookie.path}, HttpOnly: ${cookie.httpOnly}, Secure: ${cookie.secure}`);
    });
    
    // Check local storage
    const localStorage = await page.evaluate(() => {
      const items = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        items[key] = localStorage.getItem(key);
      }
      return items;
    });
    
    console.log('Local Storage:');
    Object.entries(localStorage).forEach(([key, value]) => {
      console.log(`- ${key}: ${value.substring(0, 50)}${value.length > 50 ? '...' : ''}`);
    });
    
    // Check session storage
    const sessionStorage = await page.evaluate(() => {
      const items = {};
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        items[key] = sessionStorage.getItem(key);
      }
      return items;
    });
    
    console.log('Session Storage:');
    Object.entries(sessionStorage).forEach(([key, value]) => {
      console.log(`- ${key}: ${value.substring(0, 50)}${value.length > 50 ? '...' : ''}`);
    });
    
    return true;
  } catch (error) {
    console.error('Error examining storage:', error);
    return false;
  } finally {
    await page.close();
  }
}

// Main test flow
async function runTests() {
  console.log('🚀 Starting E2E authentication tests...');
  await ensureScreenshotDir();
  
  const browser = await puppeteer.launch({ 
    headless: false, // Set to true for production, false for debugging
    defaultViewport: { width: 1280, height: 800 },
    args: ['--window-size=1280,800'],
    slowMo: 50 // slow down by ms
  });
  
  try {
    // Step 1: Test registration
    const registrationSuccess = await testRegistration(browser);
    if (!registrationSuccess) {
      console.log('⚠️ Registration test failed. Continuing with login test...');
    }
    
    // Step 2: Test login
    const { page, isSuccess: loginSuccess } = await testLogin(browser);
    if (!loginSuccess) {
      console.log('⚠️ Login test failed. Skipping subsequent tests.');
      return;
    }
    
    // Step 3: Test session persistence
    const sessionPersistenceSuccess = await testSessionPersistence(browser, page);
    if (!sessionPersistenceSuccess) {
      console.log('⚠️ Session persistence test failed.');
    }
    
    // Step 4: Test logout
    const logoutSuccess = await testLogout(browser, page);
    if (!logoutSuccess) {
      console.log('⚠️ Logout test failed.');
    }
    
    // Step 5: Examine storage and cookies
    await examineStorageAndCookies(browser);
    
    // Report final results
    console.log('\n🔹 TEST SUMMARY 🔹');
    console.log(`Registration: ${registrationSuccess ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Login: ${loginSuccess ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Session Persistence: ${sessionPersistenceSuccess ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Logout: ${logoutSuccess ? '✅ PASSED' : '❌ FAILED'}`);
    
    const overallSuccess = registrationSuccess && loginSuccess && sessionPersistenceSuccess && logoutSuccess;
    console.log(`\nOverall Test Result: ${overallSuccess ? '✅ PASSED' : '❌ FAILED'}`);
    
  } catch (error) {
    console.error('Test suite error:', error);
  } finally {
    await browser.close();
    console.log('\n🏁 E2E authentication tests completed!');
  }
}

// Run the tests
runTests(); 