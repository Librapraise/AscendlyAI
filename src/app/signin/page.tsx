"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, LogIn, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';

export default function SignInPage() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const router = useRouter();
  const { signIn, isAuthenticated, isLoading: authLoading } = useAuth();

  // FIX: Updated API URL to match your backend endpoint
  const API_URL = 'https://weapply.onrender.com/api/v1/users/login';

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, authLoading, router]);

  // Don't render the form if we're still checking auth or if user is authenticated
  if (authLoading || isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin text-blue-400 mx-auto mb-4" />
          <p className="text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  const validateForm = () => {
    const { email, password } = formData;
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMessage({ type: 'error', text: 'Please enter a valid email address' });
      return false;
    }
    if (!password) {
      setMessage({ type: 'error', text: 'Password is required' });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setMessage({ type: '', text: '' });

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // Step 1: Login and get token
      const formDataToSend = new FormData();
      formDataToSend.append('username', formData.email.trim().toLowerCase());
      formDataToSend.append('password', formData.password);

      const response = await fetch(API_URL, {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Login failed. Please try again.';
        
        if (response.status === 401) {
          errorMessage = 'Invalid email or password.';
        } else if (response.status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const { access_token, token_type } = data;

      if (!access_token) {
        throw new Error('Login succeeded but no access token received.');
      }

      // Step 2: Fetch user data using the token
      const userResponse = await fetch('https://weapply.onrender.com/api/v1/users/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Accept': 'application/json',
        },
      });

      if (userResponse.ok) {
        const userData = await userResponse.json();
        
        // Create a User object that matches your User interface
        const userForContext = {
          id: userData.id || userData.user_id || Date.now().toString(),
          email: userData.email || formData.email,
          name: userData.first_name || userData.name || 'User',
          // Add any other fields your User interface requires
          ...userData
        };
        
        setMessage({ type: 'success', text: `Welcome back, ${userForContext.name}! Redirecting...` });
        
        // Use the AuthContext signIn method
        setTimeout(() => {
          signIn(userForContext, access_token);
        }, 1000);
        
      } else {
        // Token is valid but couldn't fetch user data - create minimal user object
        const minimalUser = {
          id: Date.now().toString(),
          email: formData.email,
          name: 'User'
        };
        
        setMessage({ type: 'success', text: 'Login successful! Redirecting...' });
        setTimeout(() => {
          signIn(minimalUser, access_token);
        }, 1000);
      }

    } catch (error) {
      console.error('Login failed:', error);
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setMessage({ type: 'error', text: 'Network error. Please check your connection and try again.' });
      } else if (error instanceof Error) {
        setMessage({ type: 'error', text: error.message });
      } else {
        setMessage({ type: 'error', text: 'An unexpected error occurred. Please try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear message on new input
    if (message.text) setMessage({ type: '', text: '' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-800 rounded-3xl shadow-2xl border border-gray-700 p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
            <p className="text-gray-300">Sign in to your account</p>
          </div>

          {message.text && (
            <div className={`mb-6 p-4 rounded-xl flex items-center space-x-3 ${
              message.type === 'error' 
                ? 'bg-red-500/10 border border-red-500/20' 
                : 'bg-green-500/10 border border-green-500/20'
            }`}>
              {message.type === 'error' ? (
                <AlertCircle size={20} className="text-red-400 flex-shrink-0" />
              ) : (
                <CheckCircle size={20} className="text-green-400 flex-shrink-0" />
              )}
              <p className={`text-sm ${message.type === 'error' ? 'text-red-400' : 'text-green-400'}`}>
                {message.text}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                disabled={isLoading}
                autoComplete="email"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:opacity-50"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                  disabled={isLoading}
                  autoComplete="current-password"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 pr-12 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 focus:outline-none disabled:opacity-50"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !formData.email || !formData.password}
              className="cursor-pointer w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
            >
              {isLoading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <LogIn size={20} />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-300">
              Don't have an account?{' '}
              <a href="/signup" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors duration-200">
                Sign Up
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}