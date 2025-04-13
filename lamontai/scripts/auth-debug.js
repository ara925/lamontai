const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const mkdir = promisify(fs.mkdir);

// Use stealth plugin to avoid detection
puppeteer.use(StealthPlugin());

// Create directory for screenshots
const screenshotDir = path.join(__dirname, '..', 'debug-screenshots');
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir);
}

// Helper function to log messages with timestamps
function log(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

// Helper function for delays
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper function to save network requests/responses
function setupNetworkMonitoring(page) {
  const requests = [];
  
  page.on('request', request => {
    requests.push({
      url: request.url(),
      method: request.method(),
      headers: request.headers(),
      postData: request.postData(),
      timestamp: new Date().toISOString(),
      type: 'request'
    });
  });
  
  page.on('response', async response => {
    try {
      let responseBody = null;
      if (response.url().includes('/api/')) {
        try {
          responseBody = await response.text();
          // Try to parse JSON
          try {
            responseBody = JSON.parse(responseBody);
          } catch (e) {
            // Keep as text if not JSON
          }
        } catch (e) {
          responseBody = 'Could not retrieve response body';
        }
      }
      
      requests.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText(),
        headers: response.headers(),
        body: responseBody,
        timestamp: new Date().toISOString(),
        type: 'response'
      });
      
      // Log API responses
      if (response.url().includes('/api/')) {
        log(`Response from ${response.url()}: ${response.status()} ${response.statusText()}`);
        if (responseBody) {
          log(`Response body: ${JSON.stringify(responseBody, null, 2)}`);
        }
      }
    } catch (error) {
      log(`Error capturing response: ${error.message}`);
    }
  });
  
  return requests;
}

// Helper function to take screenshots
async function takeScreenshot(page, name) {
  const filename = path.join(screenshotDir, `${name}-${Date.now()}.png`);
  await page.screenshot({ path: filename, fullPage: true });
  log(`Screenshot saved: ${filename}`);
  return filename;
}

// Capture console messages
function setupConsoleMonitoring(page) {
  const consoleMessages = [];
  
  page.on('console', msg => {
    const messageObj = {
      type: msg.type(),
      text: msg.text(),
      timestamp: new Date().toISOString()
    };
    consoleMessages.push(messageObj);
    
    // Log console messages
    log(`Console ${msg.type()}: ${msg.text()}`);
  });
  
  return consoleMessages;
}

// Main function
async function debugAuthFlow() {
  const debugData = {
    registration: {
      success: null,
      screenshots: [],
      networkRequests: [],
      consoleMessages: [],
      errors: [],
      bodyContent: null
    },
    login: {
      success: null,
      screenshots: [],
      networkRequests: [],
      consoleMessages: [],
      errors: [],
      bodyContent: null
    },
    cookieInfo: null,
    meApiResponse: null
  };
  
  log('Starting authentication flow debugging...');
  
  // Generate unique test credentials
  const testEmail = `test${Date.now()}@example.com`;
  const testPassword = 'Test123!@#';
  const testConfirmPassword = testPassword; // Explicitly set confirm password to be the same
  const testName = 'Test User';
  
  log(`Using test credentials: ${testEmail} / ${testPassword}`);
  log(`Confirm password matches main password: ${testPassword === testConfirmPassword}`);
  
  // Launch browser
  const browser = await puppeteer.launch({
    headless: false, // Set to true for production, false for debugging
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080'],
    defaultViewport: { width: 1920, height: 1080 }
  });
  
  try {
    // Create a new page with longer timeouts
    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(60000);
    await page.setDefaultTimeout(60000);
    
    // Enable both request interception and console logging
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      try {
        // Log all requests
        if (request.url().includes('/api/')) {
          log(`Request: ${request.method()} ${request.url()}`);
        }
        // Always continue the request, even if error occurs in logging
        request.continue();
      } catch (e) {
        // Ensure request.continue() gets called even in case of error
        log(`Error in request handler: ${e.message}, continuing request anyway`);
        try { request.continue(); } catch (e2) { /* ignore secondary errors */ }
      }
    });
    
    // Setup monitoring
    debugData.registration.networkRequests = setupNetworkMonitoring(page);
    debugData.registration.consoleMessages = setupConsoleMonitoring(page);
    
    // ===== REGISTRATION FLOW =====
    log('Starting registration flow...');
    
    // Navigate to registration page
    log('Navigating to registration page...');
    await page.goto('http://localhost:3001/auth/register', { 
      waitUntil: 'networkidle2',
      timeout: 60000
    });
    debugData.registration.screenshots.push(await takeScreenshot(page, 'register-page-loaded'));
    
    // Take screenshot of what's visible regardless of form detection
    log('Checking for form elements...');
    const bodyContent = await page.evaluate(() => document.body.innerHTML);
    log(`Page body length: ${bodyContent.length} characters`);
    debugData.registration.bodyContent = bodyContent.substring(0, 5000) + '...'; // Save first 5000 chars
    
    try {
      // Try to find input elements even if form is not directly found
      const hasEmailInput = await page.$('input[type="email"]');
      const hasPasswordInput = await page.$('input[type="password"]');
      
      if (hasEmailInput && hasPasswordInput) {
        log('Found input fields for email and password');
        
        // Fill out registration form by targeting inputs directly
        log('Filling out registration form...');
        await page.type('input[type="email"]', testEmail);
        
        // Find all password fields to handle both password and confirm password
        const passwordFields = await page.$$('input[type="password"]');
        
        if (passwordFields.length >= 2) {
          log(`Found ${passwordFields.length} password fields`);
          // Explicitly log the values being typed to confirm they match
          log(`Password being typed: ${testPassword}`);
          log(`Confirm password being typed: ${testConfirmPassword}`);
          
          // Use the first for password, second for confirmation
          await passwordFields[0].type(testPassword);
          await passwordFields[1].type(testConfirmPassword);
          log('Filled both password and confirm password fields');
          
          // Double-check password fields
          const passwordContent = await passwordFields[0].evaluate(el => el.value);
          const confirmContent = await passwordFields[1].evaluate(el => el.value);
          log(`Password field contains ${passwordContent.length} characters`);
          log(`Confirm field contains ${confirmContent.length} characters`);
          log(`Passwords match: ${passwordContent === confirmContent}`);
        } else if (passwordFields.length === 1) {
          // Only one password field found, type into it
          await passwordFields[0].type(testPassword);
          
          // Look for confirm password field using other attributes
          const confirmPasswordInput = await page.$('input[name="confirmPassword"]') || 
                                      await page.$('input[placeholder*="confirm" i]') ||
                                      await page.$('input[placeholder*="retype" i]') ||
                                      await page.$('input[placeholder*="verify" i]') ||
                                      await page.$('input[id*="confirm" i]');
                                      
          if (confirmPasswordInput) {
            // Explicitly use the same confirm password
            await confirmPasswordInput.type(testConfirmPassword);
            log('Found and filled confirm password field with matching password');
            
            // Verify the confirm password field
            const confirmContent = await confirmPasswordInput.evaluate(el => el.value);
            log(`Confirm field contains ${confirmContent.length} characters`);
          } else {
            log('WARNING: Could not find confirm password field');
          }
        }
        
        // Look for name input differently
        const nameInput = await page.$('input[name="name"]') || 
                         await page.$('input[placeholder*="name" i]') ||
                         await page.$('input:not([type="email"]):not([type="password"]):not([type="submit"])');
        
        if (nameInput) {
          await nameInput.type(testName);
          log('Found and filled name field');
        } else {
          log('Could not find name field');
        }
        
        // Look for a submit button
        const submitButton = await page.$('button[type="submit"]') || 
                            await page.$('button:contains("Register")') ||
                            await page.$('button:contains("Sign up")') ||
                            await page.$('button:contains("Create")');
        
        if (submitButton) {
          log('Found submit button, attempting to click...');
          debugData.registration.screenshots.push(await takeScreenshot(page, 'register-form-filled'));
          
          // Click submit
          await submitButton.click();
          log('Submit button clicked.');

          // Wait specifically for the API response instead of a fixed delay or URL change
          log('Waiting for /api/auth/register response...');
          try {
            const registerResponse = await page.waitForResponse(
              response => 
                response.url().includes('/api/auth/register') && 
                response.request().method() === 'POST',
              { timeout: 15000 } // Increased timeout to 15 seconds
            );
            log(`Received response from ${registerResponse.url()}: ${registerResponse.status()}`);
            
            // Store the response details in our network logs if not already captured
            // (setupNetworkMonitoring might have already done this)
            const captured = debugData.registration.networkRequests.some(r => 
              r.url === registerResponse.url() && r.type === 'response'
            );
            if (!captured) {
              let responseBody = null;
              try {
                 responseBody = await registerResponse.json();
              } catch (e) { 
                 try { responseBody = await registerResponse.text(); } catch (e2) {} 
              }
              debugData.registration.networkRequests.push({
                url: registerResponse.url(),
                status: registerResponse.status(),
                statusText: registerResponse.statusText(),
                headers: registerResponse.headers(),
                body: responseBody,
                timestamp: new Date().toISOString(),
                type: 'response'
              });
              log(`Manually captured register response body: ${JSON.stringify(responseBody)}`);
            }

          } catch (waitError) {
            log(`Error waiting for /api/auth/register response: ${waitError.message}`);
            debugData.registration.errors.push('Did not receive API response after submit');
            
            // Try direct fetch API call as fallback
            log('Attempting direct API registration call...');
            
            try {
              const directResponse = await page.evaluate(async (testEmail, testName, testPassword, testConfirmPassword) => {
                try {
                  console.log('Making direct fetch API call to /api/auth/register');
                  const res = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      email: testEmail,
                      name: testName,
                      password: testPassword,
                      confirmPassword: testConfirmPassword
                    })
                  });
                  
                  const status = res.status;
                  let data = null;
                  
                  try {
                    data = await res.json();
                  } catch (e) {
                    console.error('Error parsing JSON response:', e);
                  }
                  
                  return {
                    status,
                    data,
                    ok: res.ok
                  };
                } catch (error) {
                  console.error('Error in direct API call:', error);
                  return { error: error.message || 'Unknown error in direct API call' };
                }
              }, testEmail, testName, testPassword, testConfirmPassword);
              
              log(`Direct API registration response: ${JSON.stringify(directResponse)}`);
              
              if (directResponse.ok) {
                debugData.registration.success = true;
                log('Registration success confirmed via direct API call');
              } else if (directResponse.error) {
                debugData.registration.errors.push(`Direct API error: ${directResponse.error}`);
              } else if (directResponse.data?.message) {
                debugData.registration.errors.push(`API message: ${directResponse.data.message}`);
              }
            } catch (directApiError) {
              log(`Error making direct API call: ${directApiError.message}`);
            }
          }
          
          // Add a small extra delay just in case client-side needs a moment after API response
          await delay(1000);
          log('Finished waiting after registration submission.');
          
          debugData.registration.screenshots.push(await takeScreenshot(page, 'register-after-api-wait'));
        } else {
          log('Could not find submit button');
          // Try manually submitting with Enter key on last input
          log('Attempting to submit form with Enter key');
          await page.keyboard.press('Enter');
          await delay(5000); // Use this instead of waitForTimeout
          debugData.registration.screenshots.push(await takeScreenshot(page, 'register-form-enter-key'));
        }
      } else {
        log('Could not find email and password inputs. Taking screenshots of what is visible.');
        // Try direct API call as fallback
        log('Attempting direct API registration call...');
        
        const response = await page.evaluate(async (testEmail, testName, testPassword) => {
          try {
            const res = await fetch('/api/auth/register', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                email: testEmail,
                name: testName,
                password: testPassword,
                confirmPassword: testPassword
              })
            });
            
            return {
              status: res.status,
              data: await res.json()
            };
          } catch (error) {
            return { error: error.message };
          }
        }, testEmail, testName, testPassword);
        
        log(`Direct API registration response: ${JSON.stringify(response)}`);
      }
    } catch (formError) {
      log(`Error during form interaction: ${formError.message}`);
      debugData.registration.errors.push(formError.message);
    }
    
    // Take screenshot after registration attempt regardless of result
    debugData.registration.screenshots.push(await takeScreenshot(page, 'after-registration-attempt'));
    
    // Check current URL AND network logs to determine registration outcome more reliably
    const currentUrl = page.url();
    log(`Current URL after registration wait: ${currentUrl}`);
    
    // Check network logs for the /api/auth/register response
    const registerApiResponse = debugData.registration.networkRequests.find(r => 
      r.url?.includes('/api/auth/register') && r.type === 'response'
    );
    
    if (registerApiResponse && registerApiResponse.status === 201) {
      log(`Registration API call successful (Status ${registerApiResponse.status}). Body: ${JSON.stringify(registerApiResponse.body)}`);
      // Check if token exists in the response body
      if (registerApiResponse.body?.success && registerApiResponse.body?.data?.token) {
         log('Token found in registration response.');
         debugData.registration.success = true;
      } else {
         log('Registration API success, but token missing in response body.');
         debugData.registration.success = false;
         debugData.registration.errors.push('Token missing in API response');
      }
    } else {
      log(`Registration API call failed or not found. Status: ${registerApiResponse?.status}`);
      debugData.registration.success = false;
      if (registerApiResponse?.body?.message) {
          debugData.registration.errors.push(registerApiResponse.body.message);
      }
      // Also check for visible errors on the page
      try {
        const errorText = await page.evaluate(() => {
          const errorElements = Array.from(document.querySelectorAll('p.text-red-700, div.text-red-700, div.text-red-500, p.text-red-500, .error, [role="alert"]'));
          return errorElements.map(el => el.textContent).join(' | ');
        });
        if (errorText) {
          log(`Found visible error message on page: ${errorText}`);
          debugData.registration.errors.push(errorText);
        }
      } catch (e) {
        log(`Error extracting page error messages: ${e.message}`);
      }
    }
    
    // Only proceed to login test IF registration was successful according to API response
    if (debugData.registration.success === true) {
      log('Registration successful, proceeding to login testing...');
      // === LOGIN TESTING (conditional) =====
      // Navigate to login only if registration succeeded
      log('Navigating to login page for testing...');
      await page.goto('http://localhost:3001/auth/login', { 
        waitUntil: 'networkidle2',
        timeout: 60000 
      });
      
      // Rest of login code with similar resilience improvements...
      // Setup new monitoring for login
      debugData.login.networkRequests = setupNetworkMonitoring(page);
      debugData.login.consoleMessages = setupConsoleMonitoring(page);
      
      debugData.login.screenshots.push(await takeScreenshot(page, 'login-page-loaded'));
      
      // Check page for login form elements
      const loginPageBody = await page.evaluate(() => document.body.innerHTML);
      log(`Login page body length: ${loginPageBody.length} characters`);
      debugData.login.bodyContent = loginPageBody.substring(0, 5000) + '...';
      
      try {
        // Look for login inputs
        const emailInput = await page.$('input[type="email"]') || await page.$('input[name="email"]');
        const passwordInput = await page.$('input[type="password"]');
        
        if (emailInput && passwordInput) {
          log('Found login form inputs');
          
          // Fill out login form
          log('Filling out login form...');
          await emailInput.type(testEmail);
          await passwordInput.type(testPassword);
          
          debugData.login.screenshots.push(await takeScreenshot(page, 'login-form-filled'));
          
          // Find and click login button
          const loginButton = await page.$('button[type="submit"]') || 
                            await page.$('button:contains("Login")') ||
                            await page.$('button:contains("Sign in")');
          
          if (loginButton) {
            log('Found login button, clicking...');
            
            // Click and wait for navigation
            await Promise.all([
              loginButton.click(),
              page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 }).catch((e) => {
                log('Navigation after login did not complete: ' + e.message);
              })
            ]);
            
          } else {
            log('Could not find login button, trying Enter key');
            await passwordInput.press('Enter');
            await delay(5000); // Use this instead of waitForTimeout
          }
          
          // Wait a moment for processing
          await delay(5000); // Use this instead of waitForTimeout
          debugData.login.screenshots.push(await takeScreenshot(page, 'after-login-attempt'));
          
          // Check login outcome
          const loginUrl = page.url();
          log(`URL after login attempt: ${loginUrl}`);
          
          if (loginUrl.includes('/dashboard')) {
            log('Login appears successful - redirected to dashboard');
            debugData.login.success = true;
          } else {
            log('Login failed or did not redirect to dashboard.');
            debugData.login.success = false;
            // Extract login error message
            try {
              const loginErrorText = await page.evaluate(() => {
                const errorElements = Array.from(document.querySelectorAll('p.text-red-700, div.text-red-700, div.text-red-500, p.text-red-500, .error, [role="alert"]'));
                return errorElements.map(el => el.textContent).join(' | ');
              });
              if (loginErrorText) {
                log(`Login error message: ${loginErrorText}`);
                debugData.login.errors.push(loginErrorText);
              }
            } catch (e) {
               log(`Error extracting login error messages: ${e.message}`);
            }
          }
        } else {
          log('Could not find login form inputs');
          debugData.login.success = false;
          debugData.login.errors.push('Login form inputs not found');
          // Try direct API call for login (as fallback)
          // ... (consider adding direct API login test here if needed)
        }
      } catch (loginFormError) {
        log(`Error during login form interaction: ${loginFormError.message}`);
        debugData.login.errors.push(loginFormError.message);
        debugData.login.success = false;
      }
    } else {
      log('Registration failed or status unclear, skipping login test.');
      debugData.login.success = false; // Mark login as failed if registration failed
      debugData.login.errors.push('Skipped due to registration failure');
    }
    
    // Get cookie information
    const cookies = await page.cookies();
    debugData.cookieInfo = cookies;
    log('Cookies after login attempt:');
    log(JSON.stringify(cookies, null, 2));
    
    // Check for the token cookie specifically
    const tokenCookie = cookies.find(cookie => cookie.name === 'token');
    if (tokenCookie) {
      log('Found token cookie: ' + tokenCookie.name);
      log('Token cookie domain: ' + tokenCookie.domain);
      log('Token cookie path: ' + tokenCookie.path);
      log('Token cookie httpOnly: ' + tokenCookie.httpOnly);
    } else {
      log('WARNING: No token cookie found!');
    }
    
    // Test API endpoint calls directly - try /api/auth/me
    log('Testing auth verification with /api/auth/me...');
    const meResponse = await page.evaluate(async () => {
      try {
        const res = await fetch('/api/auth/me', {
          credentials: 'include'
        });
        
        return {
          status: res.status,
          headers: Array.from(res.headers.entries()),
          data: await res.json()
        };
      } catch (error) {
        return { error: error.message };
      }
    });
    
    log(`/api/auth/me response: ${JSON.stringify(meResponse, null, 2)}`);
    debugData.meApiResponse = meResponse;
    
    // Take one final screenshot
    debugData.login.screenshots.push(await takeScreenshot(page, 'final-state'));
    
    // Save all debug data to file
    const debugDataFile = path.join(screenshotDir, 'debug-data.json');
    fs.writeFileSync(debugDataFile, JSON.stringify(debugData, null, 2));
    log(`Debug data saved to ${debugDataFile}`);
    
    // Keep the browser open for manual inspection
    log('Test completed. Browser will remain open for 30 seconds for inspection. Press Ctrl+C to close earlier.');
    await delay(30000);
    
  } catch (error) {
    log(`Error during test: ${error.message}`);
    log(error.stack);
  } finally {
    await browser.close();
    log('Test finished, browser closed.');
  }
}

// Run the debug flow
debugAuthFlow().catch(error => {
  console.error('Fatal error:', error);
}); 