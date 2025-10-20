"use client"

import React, { useState, useEffect } from 'react'
import { Eye, EyeOff, User, Mail, Lock, UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { useAuthStore } from '@/stores/useAuthStore'
import { Toast } from '@/components/ui/toast'

interface PasswordChecks {
  minLength: boolean
  hasNumber: boolean
  hasSpecial: boolean
  hasUpper: boolean
  hasLower: boolean
}

const SignUpPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [passwordChecks, setPasswordChecks] = useState<PasswordChecks>({
    minLength: false,
    hasNumber: false,
    hasSpecial: false,
    hasUpper: false,
    hasLower: false
  })
  const [submitted, setSubmitted] = useState(false)
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const { signup, isSigningUp } = useAuthStore() as any;

  const validatePassword = (pass: string) => {
    setPasswordChecks({
      minLength: pass.length >= 8,
      hasNumber: /\d/.test(pass),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(pass),
      hasUpper: /[A-Z]/.test(pass),
      hasLower: /[a-z]/.test(pass)
    })
  }

  useEffect(() => {
    validatePassword(formData.password)
  }, [formData.password])

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

  const isPasswordValid = (): boolean => {
    return Object.values(passwordChecks).every(check => check === true)
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required'
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Name must be at least 2 characters'
    }

    if (!isPasswordValid()) {
      newErrors.password = 'Password does not meet all requirements'
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
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
      await signup(formData);
      setToastType('success');
      setToastMessage('Account created successfully!');
      setShowToast(true);
      setSubmitted(true);
      
      // Reset form
      setFormData({
        email: '',
        fullName: '',
        password: '',
        confirmPassword: ''
      });

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 2000);

    } catch (error: any) {
      setToastType('error');
      setToastMessage(error?.response?.data?.message || 'Failed to create account. Please try again.');
      setShowToast(true);
    }
  }

  const PasswordCheckItem = ({ checked, label }: { checked: boolean; label: string }) => (
    <div className="flex items-center gap-2">
      {checked ? (
        <CheckCircle2 className="h-4 w-4 text-[#00d9ff]" />
      ) : (
        <div className="h-4 w-4 rounded-full border border-gray-600" />
      )}
      <span className={`text-xs ${checked ? 'text-[#00d9ff]' : 'text-gray-500'}`}>
        {label}
      </span>
    </div>
  )

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
            <div className="text-3xl font-bold text-[#00d9ff] mb-2">SignUp</div>
            <p className="text-gray-400 text-sm">Create your account to get started</p>
          </div>
        </div>

        {/* Success Message */}
        {submitted && (
          <div className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <span className="text-sm text-green-400">Account created successfully!</span>
          </div>
        )}

        {/* Form Card */}
        <div className="rounded-xl p-8" style={{ backgroundColor: '#1e1e1e' }}>
          <form onSubmit={handleSubmit} className="space-y-5 ">
            {/* Full Name Field */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4 text-gray-400" />
                <label htmlFor="fullName" className="text-sm font-medium text-white">
                  Full Name
                </label>
              </div>
              <input
                id="fullName"
                name="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="John Doe"
                className="w-full px-4 py-3 rounded-lg border transition-all duration-200 bg-[#2a2a2a] border-[#2a2a2a] text-white placeholder-gray-500 focus:outline-none focus:border-[#00d9ff] focus:ring-1 focus:ring-[#00d9ff]"
              />
              {errors.fullName && (
                <div className="flex items-center gap-2 mt-2 text-red-400">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-xs">{errors.fullName}</span>
                </div>
              )}
            </div>

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
              <div className="flex items-center gap-2 mb-2">
                <Lock className="h-4 w-4 text-gray-400" />
                <label htmlFor="password" className="text-sm font-medium text-white">
                  Password
                </label>
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

              {/* Password Checklist */}
              {formData.password && (
                <div className="mt-3 p-3 rounded-lg bg-[#2a2a2a] space-y-2">
                  <PasswordCheckItem checked={passwordChecks.minLength} label="At least 8 characters" />
                  <PasswordCheckItem checked={passwordChecks.hasUpper} label="One uppercase letter" />
                  <PasswordCheckItem checked={passwordChecks.hasLower} label="One lowercase letter" />
                  <PasswordCheckItem checked={passwordChecks.hasNumber} label="One number" />
                  <PasswordCheckItem checked={passwordChecks.hasSpecial} label="One special character" />
                </div>
              )}

              {errors.password && (
                <div className="flex items-center gap-2 mt-2 text-red-400">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-xs">{errors.password}</span>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Lock className="h-4 w-4 text-gray-400" />
                <label htmlFor="confirmPassword" className="text-sm font-medium text-white">
                  Confirm Password
                </label>
              </div>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-lg border transition-all duration-200 bg-[#2a2a2a] border-[#2a2a2a] text-white placeholder-gray-500 focus:outline-none focus:border-[#00d9ff] focus:ring-1 focus:ring-[#00d9ff]"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <div className="flex items-center gap-2 mt-2 text-red-400">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-xs">{errors.confirmPassword}</span>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={isSigningUp}
              className="w-full py-3 rounded-lg cursor-pointer font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 mt-6 bg-[#00d9ff] text-[#121212] hover:bg-[#00c9e8] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSigningUp ? (
                <>
                  <div className="h-4 w-4 border-2 border-[#121212] border-t-transparent rounded-full animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Create Account
                </>
              )}
            </button>

            {/* Login Link */}
            <p className="text-center text-sm text-gray-400 mt-4">
              Already have an account?{' '}
              <Link href="/login" className="text-[#00d9ff] hover:underline font-medium">
                Sign In
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}

export default SignUpPage