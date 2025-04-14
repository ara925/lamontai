/**
 * Circuit Breaker implementation for handling external API failures gracefully
 * 
 * The circuit breaker pattern prevents cascading failures when external services
 * are unavailable by temporarily stopping requests after a threshold of failures.
 */

// States enum
const State = {
  CLOSED: 'CLOSED',       // Normal operation, requests allowed
  OPEN: 'OPEN',           // Circuit is open, requests are not allowed
  HALF_OPEN: 'HALF_OPEN'  // Testing if service is back, allowing limited requests
};

// In-memory storage for circuit breakers
const circuitBreakers = new Map();

/**
 * Create a new circuit breaker
 * @param {Object} options - Configuration options
 * @returns {Object} - Circuit breaker instance
 */
function createCircuitBreaker(options = {}) {
  const {
    name = 'default',
    failureThreshold = 3,        // Number of failures before opening circuit
    resetTimeout = 30000,        // Time in ms to wait before trying again (30 seconds)
    halfOpenSuccessThreshold = 2, // Successful calls in half-open state to close circuit
    timeout = 10000,             // Timeout for function execution in ms
    fallbackFn = null            // Optional fallback function
  } = options;

  // Create a new circuit breaker if one doesn't exist
  if (!circuitBreakers.has(name)) {
    circuitBreakers.set(name, {
      state: State.CLOSED,
      failures: 0,
      successes: 0,
      lastFailureTime: null,
      halfOpenSuccessCount: 0,
      name
    });
  }

  const breaker = circuitBreakers.get(name);

  /**
   * Fire the circuit breaker
   * @param {Function} fn - The function to execute
   * @param {Array} args - Arguments to pass to the function
   * @returns {Promise<any>} - Result of the function or fallback
   */
  async function fire(fn, ...args) {
    // Check the current state
    if (breaker.state === State.OPEN) {
      // Check if it's time to try again
      const now = Date.now();
      if (now - breaker.lastFailureTime >= resetTimeout) {
        // Move to half-open state
        breaker.state = State.HALF_OPEN;
        breaker.halfOpenSuccessCount = 0;
        console.log(`Circuit ${name} is now half-open`);
      } else {
        // Circuit is still open
        console.log(`Circuit ${name} is open - using fallback`);
        return handleFallback(...args);
      }
    }

    try {
      // Set a timeout for the function
      const result = await Promise.race([
        fn(...args),
        new Promise((_, reject) => setTimeout(() => 
          reject(new Error(`Operation timed out after ${timeout}ms`)), timeout)
        )
      ]);

      // Success handling
      if (breaker.state === State.HALF_OPEN) {
        breaker.halfOpenSuccessCount++;
        
        if (breaker.halfOpenSuccessCount >= halfOpenSuccessThreshold) {
          // Reset the circuit
          breaker.state = State.CLOSED;
          breaker.failures = 0;
          console.log(`Circuit ${name} is now closed`);
        }
      } else if (breaker.state === State.CLOSED) {
        // Reset failures on successful call
        breaker.failures = 0;
      }

      return result;
    } catch (error) {
      // Failure handling
      breaker.failures++;
      breaker.lastFailureTime = Date.now();

      if (breaker.state === State.CLOSED && breaker.failures >= failureThreshold) {
        // Open the circuit
        breaker.state = State.OPEN;
        console.log(`Circuit ${name} is now open due to ${breaker.failures} failures`);
      } else if (breaker.state === State.HALF_OPEN) {
        // Back to open state
        breaker.state = State.OPEN;
        console.log(`Circuit ${name} returned to open state after failure in half-open state`);
      }

      return handleFallback(...args);
    }
  }

  /**
   * Handle fallback logic
   * @returns {Promise<any>} - Result of fallback or error
   */
  async function handleFallback(...args) {
    if (typeof fallbackFn === 'function') {
      return fallbackFn(...args);
    }
    
    throw new Error(`Service ${name} is unavailable`);
  }

  /**
   * Get the current state of the circuit
   * @returns {Object} - Circuit breaker state information
   */
  function getState() {
    return {
      name: breaker.name,
      state: breaker.state,
      failures: breaker.failures,
      lastFailureTime: breaker.lastFailureTime
    };
  }

  /**
   * Reset the circuit breaker to closed state
   */
  function reset() {
    breaker.state = State.CLOSED;
    breaker.failures = 0;
    breaker.lastFailureTime = null;
    breaker.halfOpenSuccessCount = 0;
    console.log(`Circuit ${name} has been manually reset`);
  }

  // Return the public interface
  return {
    fire,
    getState,
    reset
  };
}

module.exports = {
  createCircuitBreaker,
  State
}; 