'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { z } from 'zod';
import { setUserData, isAuthenticated } from '@/lib/auth-utils';
import { signIn } from 'next-auth/react';

// Define validation schema
const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupFormData = z.infer<typeof signupSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState<SignupFormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [generalError, setGeneralError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Check if already authenticated and redirect if needed
  useEffect(() => {
    const checkExistingAuth = async () => {
      const authenticated = await isAuthenticated();
      
      console.log('Register page initial auth check:', { 
        isAuthenticated: authenticated
      });
      
      if (authenticated) {
        console.log('User is already authenticated, redirecting to dashboard');
        router.push('/dashboard');
      }
    };
    
    checkExistingAuth();
  }, [router]);

  // Check for error in URL (from NextAuth)
  useEffect(() => {
    const errorType = searchParams?.get('error');
    if (errorType) {
      switch (errorType) {
        case 'OAuthSignin':
        case 'OAuthCallback':
        case 'OAuthCreateAccount':
          setGeneralError('There was a problem with Google sign in. Please try again.');
          break;
        case 'Callback':
          setGeneralError('There was a problem creating your account. Please try again.');
          break;
        default:
          setGeneralError('An error occurred during registration. Please try again.');
          break;
      }
    }
  }, [searchParams]);

  const validateField = (name: keyof SignupFormData, value: string) => {
    try {
      // Create a partial schema for just this field
      const partialSchema = z.object({ [name]: name === 'name' 
        ? z.string().min(2)
        : name === 'email' 
          ? z.string().email()
          : name === 'password' 
            ? z.string().min(8)
            : z.string() 
      });
      
      partialSchema.parse({ [name]: value });
      
      // If it passes, clear the error for this field
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
      
      // Special handling for confirmPassword
      if (name === 'confirmPassword' || name === 'password') {
        // Only check for matching if both fields have values
        if (formData.password && (name === 'confirmPassword' ? value : formData.confirmPassword)) {
          const password = name === 'password' ? value : formData.password;
          const confirmValue = name === 'confirmPassword' ? value : formData.confirmPassword;
          
          if (password !== confirmValue) {
            setErrors(prev => ({
              ...prev,
              confirmPassword: "Passwords don't match",
            }));
          } else {
            // Passwords match, clear the error
            setErrors(prev => {
              const newErrors = { ...prev };
              delete newErrors.confirmPassword;
              return newErrors;
            });
          }
        }
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldError = error.errors.find(e => e.path[0] === name);
        if (fieldError) {
          setErrors(prev => ({
            ...prev,
            [name]: fieldError.message,
          }));
        }
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    validateField(name as keyof SignupFormData, value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError('');
    setErrors({}); // Clear previous errors
    setIsLoading(true);
    console.log('[RegisterPage handleSubmit] Starting...');

    try {
      // Validate all form data
      const validationResult = signupSchema.safeParse(formData);
      
      if (!validationResult.success) {
        const formattedErrors = validationResult.error.format();
        const newErrors: {[key: string]: string} = {};
        
        // Extract error messages (with type-safe approach)
        for (const key of Object.keys(formattedErrors)) {
          if (key !== '_errors') {
            // Type guard to check if key is a valid field
            if (key === 'name' || key === 'email' || key === 'password' || key === 'confirmPassword') {
              const fieldErrors = formattedErrors[key]?._errors;
              if (fieldErrors && fieldErrors.length > 0) {
                newErrors[key] = fieldErrors[0];
              }
            }
          }
        }
        
        setErrors(newErrors);
        console.error('[RegisterPage handleSubmit] Frontend validation failed:', newErrors);
        throw new Error("Please fix the form errors");
      }

      console.log(`[RegisterPage handleSubmit] Frontend validation passed. Sending request to /api/auth/register for: ${formData.email}`);
      
      // Send registration request
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Ensure cookies are included
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword
        }),
      });
      
      console.log(`[RegisterPage handleSubmit] Received response status: ${response.status}`);
      const data = await response.json();
      console.log('[RegisterPage handleSubmit] Received response body:', data);
      
      if (!response.ok) {
        console.error('[RegisterPage handleSubmit] API response not OK:', data.message || 'Registration failed');
        // Specific error for user already exists
        if (data.message && data.message.toLowerCase().includes('already exists')) {
            setErrors(prev => ({ ...prev, email: 'This email is already registered. Try logging in.' }));
            throw new Error('Email already exists.'); // Throw specific error
        }
        throw new Error(data.message || 'Registration failed');
      }
      
      if (data.success && data.data) {
        console.log('[RegisterPage handleSubmit] Registration successful, setting user data');
        
        // Store user data
        const userData = data.data.user || data.data;
        setUserData(userData);
        
        // Redirect to website URL confirmation page instead of dashboard
        const returnUrl = searchParams?.get('returnUrl') || '/onboarding/website-url';
        
        // Show success message
        setGeneralError('');
        console.log(`[RegisterPage handleSubmit] Redirecting to: ${returnUrl}`);
        
        // Redirect to onboarding or return URL
        setTimeout(() => {
          console.log('[RegisterPage handleSubmit] Executing redirect');
          window.location.href = returnUrl;
        }, 1500);
      } else {
        setGeneralError(data.message || 'Registration failed');
      }
    } catch (err: any) {
      if (err.message !== "Please fix the form errors" && err.message !== "Email already exists.") {
        setGeneralError(err.message || 'An error occurred during registration');
      }
      console.error('[RegisterPage handleSubmit] Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setGeneralError('');
    
    try {
      console.log('Starting Google sign-in from register page');
      
      // Call NextAuth signIn with Google provider
      const result = await signIn('google', { 
        callbackUrl: '/onboarding/website-url',
        redirect: true // Let NextAuth handle the redirect
      });
      
      console.log('Google sign-in result:', result);
    } catch (err: any) {
      setIsLoading(false);
      setGeneralError('Failed to sign in with Google. Please try again.');
      console.error('Google sign in error:', err);
    }
  };

  const togglePasswordVisibility = (field: 'password' | 'confirmPassword') => {
    if (field === 'password') {
      setShowPassword(!showPassword);
    } else {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Link href="/">
            <Image 
              src="/logo.svg" 
              alt="LamontAI Logo" 
              width={150} 
              height={50} 
              style={{ height: 'auto' }}
              className="cursor-pointer"
              priority
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/placeholder-image.svg';
              }}
            />
          </Link>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <Link href="/auth/login" className="font-medium text-orange-600 hover:text-orange-500">
            sign in to your existing account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {generalError && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-red-700">
                    {generalError}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <div className="mt-1">
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-3 py-2 border ${errors.name ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm`}
                  placeholder="John Doe"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.name}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-3 py-2 border ${errors.email ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm`}
                  placeholder="you@example.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.email}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-3 py-2 border ${errors.password ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm pr-10`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  onClick={() => togglePasswordVisibility('password')}
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.password}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-3 py-2 border ${errors.confirmPassword ? 'border-red-300' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm pr-10`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  onClick={() => togglePasswordVisibility('confirmPassword')}
                >
                  {showConfirmPassword ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading || Object.keys(errors).length > 0}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 ${(isLoading || Object.keys(errors).length > 0) ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className={`w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                <svg className="h-5 w-5" aria-hidden="true" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
                </svg>
                <span className="ml-2">Sign up with Google</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 