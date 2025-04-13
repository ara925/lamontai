// Run the auth test
import fetch from 'node-fetch';

// Base URL for API requests
const BASE_URL = 'http://localhost:3001/api';

// Store cookies between requests
let cookies = [];

// Test user details
const testUser = {
  name: 'Auth Test User',
  email: `authtest_${Date.now()}@example.com`,
  password: 'Password123!',
  confirmPassword: 'Password123!'
};

// Helper function to log steps
function log(step, message) {
  console.log(`\n--- ${step} ---`);
  console.log(message);
}

// Helper function to make API requests with cookie handling
async function makeRequest(url, options = {}) {
  const headers = options.headers || {};
  
  // Add cookies to request if we have them
  if (cookies.length > 0) {
    headers.Cookie = cookies.join('; ');
  }
  
  const response = await fetch(url, {
    ...options,
    headers
  });
  
  // Extract and store cookies from response
  const responseCookies = response.headers.raw()['set-cookie'];
  if (responseCookies) {
    cookies = responseCookies;
  }
  
  return {
    status: response.status,
    headers: response.headers,
    data: await response.json()
  };
}

// Run all tests
async function runTests() {
  try {
    // 1. Register a new user
    log('REGISTRATION', `Registering new user: ${testUser.email}`);
    const registerResponse = await makeRequest(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });
    
    log('REGISTRATION RESPONSE', {
      status: registerResponse.status,
      success: registerResponse.data.success,
      message: registerResponse.data.message,
      cookies: cookies.length > 0 ? 'Cookies received' : 'No cookies received'
    });
    
    if (!registerResponse.data.success) {
      throw new Error(`Registration failed: ${registerResponse.data.message}`);
    }
    
    // 2. Test the /me endpoint to verify our session
    log('SESSION VERIFICATION', 'Checking if we are authenticated with /me endpoint');
    const meResponse = await makeRequest(`${BASE_URL}/auth/me`);
    
    log('ME ENDPOINT RESPONSE', {
      status: meResponse.status,
      success: meResponse.data.success,
      authenticated: meResponse.data.success,
      user: meResponse.data.success ? meResponse.data.data : null
    });
    
    // 3. Log out
    log('LOGOUT', 'Logging out user');
    const logoutResponse = await makeRequest(`${BASE_URL}/auth/logout`, {
      method: 'POST'
    });
    
    log('LOGOUT RESPONSE', {
      status: logoutResponse.status,
      success: logoutResponse.data.success,
      message: logoutResponse.data.message
    });
    
    // 4. Verify we are logged out by checking /me again
    log('VERIFY LOGOUT', 'Checking if we are properly logged out');
    const afterLogoutResponse = await makeRequest(`${BASE_URL}/auth/me`);
    
    log('AFTER LOGOUT RESPONSE', {
      status: afterLogoutResponse.status,
      success: afterLogoutResponse.data.success,
      authenticated: afterLogoutResponse.data.success
    });
    
    // 5. Test login with our test user
    log('LOGIN', `Logging in with user: ${testUser.email}`);
    const loginResponse = await makeRequest(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password
      })
    });
    
    log('LOGIN RESPONSE', {
      status: loginResponse.status,
      success: loginResponse.data.success,
      message: loginResponse.data.message,
      cookies: cookies.length > 0 ? 'Cookies received' : 'No cookies received'
    });
    
    // 6. Final verification that we're logged in again
    log('FINAL VERIFICATION', 'Checking if we are authenticated after login');
    const finalMeResponse = await makeRequest(`${BASE_URL}/auth/me`);
    
    log('FINAL ME RESPONSE', {
      status: finalMeResponse.status,
      success: finalMeResponse.data.success,
      authenticated: finalMeResponse.data.success,
      user: finalMeResponse.data.success ? finalMeResponse.data.data : null
    });
    
    log('TEST SUMMARY', 'All tests completed!');
    if (finalMeResponse.data.success) {
      log('RESULT', 'SUCCESS: Server-side authentication implementation is working correctly');
    } else {
      log('RESULT', 'FAILURE: Something went wrong with the authentication flow');
    }
    
  } catch (error) {
    console.error('Error running tests:', error);
  }
}

// Execute the tests
runTests(); 