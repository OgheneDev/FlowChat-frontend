"use client"

import React, { useState } from 'react'
import { Eye, EyeOff, Mail, Lock, LogIn, AlertCircle, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { useAuthStore } from '@/stores/useAuthStore'
import { Toast } from '@/components/ui/toast'

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const {login, isLoggingIn} = useAuthStore() as any

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      await login(formData);
      setToastType("success");
      setToastMessage("Log in Successful!");
      setShowToast(true);
      setSubmitted(true);

      // Reset Form
      setFormData({
        email: '',
        password: '',
      });

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 2000);

    } catch (error: any) {
      setToastType('error');
      setToastMessage(error?.response?.data?.message || 'Failed to create login. Please try again.');
      setShowToast(true);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#121212' }}>
      <Toast
        show={showToast}
        type={toastType}
        message={toastMessage}
        onClose={() => setShowToast(false)}
      />
      <div className="w-full max-w-md">
        {/* Logo Section */}
        <div className="flex justify-center mb-8">
          <div className="text-center">
            <div className="text-3xl font-bold text-[#00d9ff] mb-2">Welcome Back</div>
            <p className="text-gray-400 text-sm">Sign in to your account to continue</p>
          </div>
        </div>

        {/* Success Message */}
        {submitted && (
          <div className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <span className="text-sm text-green-400">Logged in successfully!</span>
          </div>
        )}

        {/* Form Card */}
        <div className="rounded-xl p-8" style={{ backgroundColor: '#1e1e1e' }}>
          <div className="space-y-5">
            {/* Email Field */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <label htmlFor="email" className="text-sm font-medium text-white">
                  Email Address
                </label>
              </div>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-lg border transition-all duration-200 bg-[#2a2a2a] border-[#2a2a2a] text-white placeholder-gray-500 focus:outline-none focus:border-[#00d9ff] focus:ring-1 focus:ring-[#00d9ff]"
              />
              {errors.email && (
                <div className="flex items-center gap-2 mt-2 text-red-400">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-xs">{errors.email}</span>
                </div>
              )}
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-gray-400" />
                  <label htmlFor="password" className="text-sm font-medium text-white">
                    Password
                  </label>
                </div>
                <Link href="/forgot-password" className="text-xs text-[#00d9ff] hover:underline">
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-lg border transition-all duration-200 bg-[#2a2a2a] border-[#2a2a2a] text-white placeholder-gray-500 focus:outline-none focus:border-[#00d9ff] focus:ring-1 focus:ring-[#00d9ff]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && (
                <div className="flex items-center gap-2 mt-2 text-red-400">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-xs">{errors.password}</span>
                </div>
              )}
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center gap-3">
              <input
                id="rememberMe"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded cursor-pointer accent-[#00d9ff]"
              />
              <label htmlFor="rememberMe" className="text-sm text-gray-400 cursor-pointer hover:text-gray-300">
                Remember me
              </label>
            </div>

            {/* Login Button */}
            <button
              onClick={handleSubmit}
              disabled={isLoggingIn}
              className="w-full py-3 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 mt-6 bg-[#00d9ff] text-[#121212] hover:bg-[#00c9e8] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoggingIn ? (
                <>
                  <div className="h-4 w-4 border-2 border-[#121212] border-t-transparent rounded-full animate-spin" />
                  Signing In...
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  Sign In
                </>
              )}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-gray-600"></div>
              <span className="text-xs text-gray-500">OR</span>
              <div className="flex-1 h-px bg-gray-600"></div>
            </div>

            {/* Sign Up Link */}
            <p className="text-center text-sm text-gray-400 mt-6">
              Don't have an account?{' '}
              <Link href="/signup" className="text-[#00d9ff] hover:underline font-medium">
                Sign Up
              </Link>
            </p>
          </div>
        </div>

        {/* Footer Links */}
        <div className="mt-6 flex items-center justify-center gap-4 text-xs text-gray-500">
          <Link href="/privacy" className="hover:text-gray-400 transition-colors">Privacy Policy</Link>
          <span>•</span>
          <Link href="/terms" className="hover:text-gray-400 transition-colors">Terms of Service</Link>
        </div>
      </div>
    </div>
  )
}

export default LoginPage