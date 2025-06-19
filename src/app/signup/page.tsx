"use client";

import { useState } from 'react';
import { Eye, EyeOff, ArrowRight, Shield, AlertCircle, Link } from 'lucide-react';

export default function SignUpPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const validateForm = () => {
    // More comprehensive validation
    if (!firstName.trim() || firstName.trim().length < 2) {
      setError('First name must be at least 2 characters long');
      return false;
    }
    if (!lastName.trim() || lastName.trim().length < 2) {
      setError('Last name must be at least 2 characters long');
      return false;
    }
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }
    // More strict email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address');
      return false;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }
    // Enhanced password validation
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      setError('Password must contain at least one uppercase letter, one lowercase letter, and one number');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Clean and prepare data
      const requestData = {
        name: `${firstName.trim()} ${lastName.trim()}`,
        email: email.trim().toLowerCase(),
        password: password.trim(),
        // Add common fields that APIs might expect
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        confirm_password: confirmPassword.trim()
      };
      
      console.log('Sending request to API:', {
        url: 'https://weapply.onrender.com/api/v1/users/',
        method: 'POST',
        data: { ...requestData, password: '[HIDDEN]', confirm_password: '[HIDDEN]' }
      });
      
      const response = await fetch('https://weapply.onrender.com/api/v1/users/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      console.log('API Response Status:', response.status);
      console.log('API Response Headers:', Object.fromEntries(response.headers.entries()));

      let data;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
        console.log('API Response Data:', data);
      } else {
        const textData = await response.text();
        console.log('API Response (non-JSON):', textData);
        data = { message: 'Server returned non-JSON response', raw_response: textData };
      }

      if (response.ok) {
        setSuccess('Account created successfully! Redirecting to sign in...');
        
        // Store user data in localStorage
        if (data.token || data.access_token || data.accessToken) {
          const token = data.token || data.access_token || data.accessToken;
          const refreshToken = data.refresh_token || data.refreshToken || data.refresh;
          
          const userData = {
            token: token,
            user: data.user || { 
              name: `${firstName.trim()} ${lastName.trim()}`, 
              email: email.trim().toLowerCase(),
              first_name: firstName.trim(),
              last_name: lastName.trim()
            },
            refreshToken: refreshToken
          };
          
          console.log('Storing user data:', userData);
          
          // Store in localStorage
          localStorage.setItem('authToken', token);
          localStorage.setItem('userData', JSON.stringify(userData.user));
          if (refreshToken) {
            localStorage.setItem('refreshToken', refreshToken);
          }
          
          // Store complete auth data
          localStorage.setItem('authData', JSON.stringify(userData));
        }
        
        // Redirect to sign-in page after successful account creation
        setTimeout(() => {
          console.log('Account created successfully for:', email);
          // Navigate to sign-in page
          window.location.href = '/signin';
        }, 1500);
      } else {
        // Enhanced error handling with detailed 422 response
        let errorMessage = 'Failed to create account. Please try again.';
        
        // Log full error details for debugging
        console.error('API Error Details:', {
          status: response.status,
          statusText: response.statusText,
          data: data,
          headers: Object.fromEntries(response.headers.entries())
        });
        
        switch (response.status) {
          case 400:
            errorMessage = data.message || data.error || 'Invalid input. Please check your information.';
            if (data.errors) {
              console.log('Detailed validation errors:', data.errors);
              // Try to extract specific field errors
              const fieldErrors = Object.entries(data.errors).map(([field, errors]) => 
                `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`
              ).join(' | ');
              errorMessage = `Validation errors: ${fieldErrors}`;
            }
            break;
          case 401:
            errorMessage = 'Authentication failed. Please try again.';
            break;
          case 403:
            errorMessage = 'Account creation is not allowed.';
            break;
          case 409:
            errorMessage = 'An account with this email already exists.';
            break;
          case 422:
            // More detailed 422 error handling
            if (data.message) {
              errorMessage = data.message;
            } else if (data.error) {
              errorMessage = data.error;
            } else if (data.errors) {
              console.log('422 Validation errors:', data.errors);
              if (typeof data.errors === 'object') {
                const fieldErrors = Object.entries(data.errors).map(([field, errors]) => {
                  const errorList = Array.isArray(errors) ? errors : [errors];
                  return `${field}: ${errorList.join(', ')}`;
                }).join(' | ');
                errorMessage = `Validation failed: ${fieldErrors}`;
              } else if (Array.isArray(data.errors)) {
                errorMessage = `Validation failed: ${data.errors.join(', ')}`;
              } else {
                errorMessage = `Validation failed: ${data.errors}`;
              }
            } else {
              errorMessage = 'Validation error. Please ensure all fields meet the requirements.';
            }
            break;
          case 429:
            errorMessage = 'Too many requests. Please wait a moment and try again.';
            break;
          case 500:
            errorMessage = 'Server error. Please try again later.';
            break;
          case 502:
          case 503:
          case 504:
            errorMessage = 'Service temporarily unavailable. Please try again later.';
            break;
          default:
            errorMessage = data.message || data.error || `Server error (${response.status}). Please try again.`;
        }
        
        setError(errorMessage);
      }
    } catch (error) {
      console.error('Network/Request error:', error);
      
      if (error instanceof Error && error.name === 'TypeError' && error.message.includes('fetch')) {
        setError('Unable to connect to server. Please check your internet connection.');
      } else if (error instanceof Error && error.name === 'AbortError') {
        setError('Request timeout. Please try again.');
      } else {
        setError('Network error. Please check your connection and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-800 rounded-3xl shadow-2xl border border-gray-700 p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Join ResumMeAI</h1>
            <p className="text-gray-300">Create your account and start building</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start space-x-3">
              <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm leading-relaxed">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center space-x-3">
              <Shield size={20} className="text-green-400 flex-shrink-0" />
              <p className="text-green-400 text-sm">{success}</p>
            </div>
          )}

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  placeholder="First name"
                  required
                  minLength={2}
                  maxLength={50}
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  placeholder="Last name"
                  required
                  minLength={2}
                  maxLength={50}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter your email"
                required
                maxLength={100}
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 pr-12"
                  placeholder="Create a password"
                  required
                  minLength={8}
                  maxLength={128}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 focus:outline-none"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">Must be at least 8 characters with uppercase, lowercase, and number</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 pr-12"
                  placeholder="Confirm your password"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 focus:outline-none"
                  disabled={isLoading}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isLoading}
              className="cursor-pointer w-full flex items-center justify-center space-x-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-300">
              Already have an account?{' '}
              <a
                href="/signin"
                className="text-purple-500 hover:text-purple-400 font-semibold transition-colors duration-200"
              >
                Sign In   
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}