/**
 * Authentication Debug Utility
 * 
 * This script can be pasted into the browser console
 * to debug the authentication flow and examine cookies,
 * local storage, and authentication status
 */

(function() {
  console.clear();
  console.log('%c Authentication Debug Utility ', 'background: #0057b8; color: white; font-size: 14px; padding: 5px;');
  
  // Check cookies
  function checkCookies() {
    console.log('%c Cookies ', 'background: #2ecc71; color: white; font-weight: bold;');
    const cookies = document.cookie.split(';').map(cookie => cookie.trim());
    
    if (cookies.length === 0 || (cookies.length === 1 && cookies[0] === '')) {
      console.log('No cookies found');
    } else {
      cookies.forEach(cookie => {
        const [name, value] = cookie.split('=');
        console.log(`${name}: ${value.substring(0, 20)}${value.length > 20 ? '...' : ''}`);
      });
    }
    
    // Check for httpOnly cookies (these won't be visible directly)
    console.log('Note: HttpOnly cookies are not visible via JavaScript');
  }
  
  // Check localStorage
  function checkLocalStorage() {
    console.log('%c Local Storage ', 'background: #3498db; color: white; font-weight: bold;');
    
    if (localStorage.length === 0) {
      console.log('No items in localStorage');
    } else {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        console.log(`${key}: ${value.substring(0, 50)}${value.length > 50 ? '...' : ''}`);
      }
    }
  }
  
  // Check sessionStorage
  function checkSessionStorage() {
    console.log('%c Session Storage ', 'background: #9b59b6; color: white; font-weight: bold;');
    
    if (sessionStorage.length === 0) {
      console.log('No items in sessionStorage');
    } else {
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        const value = sessionStorage.getItem(key);
        console.log(`${key}: ${value.substring(0, 50)}${value.length > 50 ? '...' : ''}`);
      }
    }
  }
  
  // Check authentication status
  async function checkAuthStatus() {
    console.log('%c Authentication Status ', 'background: #e74c3c; color: white; font-weight: bold;');
    
    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        console.log('%c ✅ Authenticated ', 'color: #2ecc71; font-weight: bold;');
        console.log('User:', data.data);
      } else {
        console.log('%c ❌ Not authenticated ', 'color: #e74c3c; font-weight: bold;');
        console.log('Response:', data);
      }
    } catch (error) {
      console.log('%c ❌ Error checking authentication ', 'color: #e74c3c; font-weight: bold;');
      console.error(error);
    }
  }
  
  // Monitor fetch requests related to authentication
  function monitorAuthRequests() {
    console.log('%c Request Monitoring ', 'background: #f39c12; color: white; font-weight: bold;');
    console.log('Monitoring fetch requests to /api/auth/* endpoints...');
    
    const originalFetch = window.fetch;
    window.fetch = async function(url, options) {
      if (typeof url === 'string' && url.includes('/api/auth/')) {
        console.group(`%c Fetch: ${options?.method || 'GET'} ${url}`, 'color: #f39c12;');
        console.log('Options:', options);
        
        try {
          const response = await originalFetch.apply(this, arguments);
          const responseClone = response.clone();
          
          // Try to log response body
          try {
            const body = await responseClone.json();
            console.log('Response:', body);
          } catch (e) {
            console.log('Response: [not JSON]');
          }
          
          console.log('Status:', response.status);
          console.log('Headers:', [...response.headers.entries()]);
          console.groupEnd();
          return response;
        } catch (error) {
          console.error('Fetch error:', error);
          console.groupEnd();
          throw error;
        }
      }
      
      return originalFetch.apply(this, arguments);
    };
    
    console.log('Fetch monitoring active');
  }
  
  // Test login
  async function testLogin(email, password) {
    console.log('%c Login Test ', 'background: #34495e; color: white; font-weight: bold;');
    console.log(`Attempting login for ${email}...`);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        console.log('%c ✅ Login successful ', 'color: #2ecc71; font-weight: bold;');
      } else {
        console.log('%c ❌ Login failed ', 'color: #e74c3c; font-weight: bold;');
      }
      
      console.log('Response:', data);
      return data;
    } catch (error) {
      console.log('%c ❌ Login error ', 'color: #e74c3c; font-weight: bold;');
      console.error(error);
      return null;
    }
  }
  
  // Test logout
  async function testLogout() {
    console.log('%c Logout Test ', 'background: #34495e; color: white; font-weight: bold;');
    
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        console.log('%c ✅ Logout successful ', 'color: #2ecc71; font-weight: bold;');
      } else {
        console.log('%c ❌ Logout failed ', 'color: #e74c3c; font-weight: bold;');
      }
      
      console.log('Response:', data);
      return data;
    } catch (error) {
      console.log('%c ❌ Logout error ', 'color: #e74c3c; font-weight: bold;');
      console.error(error);
      return null;
    }
  }
  
  // Examine headers for a request
  async function examineRequestHeaders(url) {
    console.log(`%c Headers for ${url} `, 'background: #1abc9c; color: white; font-weight: bold;');
    
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        credentials: 'include'
      });
      
      console.log('Status:', response.status);
      console.log('Headers sent:');
      console.table([...response.headers.entries()]);
    } catch (error) {
      console.error('Error examining headers:', error);
    }
  }
  
  // Run all checks
  function runChecks() {
    checkCookies();
    checkLocalStorage();
    checkSessionStorage();
    checkAuthStatus();
  }
  
  // Expose functions to global scope
  window.authDebug = {
    checkCookies,
    checkLocalStorage,
    checkSessionStorage,
    checkAuthStatus,
    monitorAuthRequests,
    testLogin,
    testLogout,
    examineRequestHeaders,
    runChecks
  };
  
  // Run initial checks
  runChecks();
  monitorAuthRequests();
  
  console.log('%c Auth Debug Utility Ready ', 'background: #0057b8; color: white; font-size: 14px; padding: 5px;');
  console.log('Available commands:');
  console.log('• authDebug.checkCookies() - Check browser cookies');
  console.log('• authDebug.checkLocalStorage() - Check localStorage contents');
  console.log('• authDebug.checkSessionStorage() - Check sessionStorage contents');
  console.log('• authDebug.checkAuthStatus() - Check if user is authenticated');
  console.log('• authDebug.testLogin(email, password) - Test login with credentials');
  console.log('• authDebug.testLogout() - Test logout functionality');
  console.log('• authDebug.examineRequestHeaders(url) - Examine request headers');
  console.log('• authDebug.runChecks() - Run all checks');
})(); 