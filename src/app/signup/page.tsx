"use client"

import React, { useState, useEffect } from 'react'
import { Eye, EyeOff, User, Mail, Lock, UserPlus, AlertCircle, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useAuthStore } from '@/stores/useAuthStore'

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
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [focusedField, setFocusedField] = useState<string | null>(null);
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
      
      setFormData({
        email: '',
        fullName: '',
        password: '',
        confirmPassword: ''
      });

      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 2000);

    } catch (error: any) {
      setToastType('error');
      setToastMessage(error?.response?.data?.message || 'Failed to create account. Please try again.');
      setShowToast(true);
    }
  }

  const getPasswordStrength = (): number => {
    return Object.values(passwordChecks).filter(Boolean).length
  }

  const getStrengthColor = (): string => {
    const strength = getPasswordStrength()
    if (strength <= 2) return '#ef4444'
    if (strength <= 3) return '#f59e0b'
    if (strength === 4) return '#10b981'
    return '#00d9ff'
  }

  const getStrengthLabel = (): string => {
    const strength = getPasswordStrength()
    if (strength === 0) return ''
    if (strength <= 2) return 'Weak'
    if (strength <= 3) return 'Fair'
    if (strength === 4) return 'Good'
    return 'Strong'
  }

  const PasswordCheckItem = ({ checked, label }: { checked: boolean; label: string }) => (
    <div className="flex items-center gap-2 transition-all duration-200">
      <div className={`flex items-center justify-center w-4 h-4 rounded-full transition-all duration-300 ${
        checked ? 'bg-cyan-400/20' : 'bg-transparent border border-gray-600'
      }`}>
        {checked && <CheckCircle2 className="h-3 w-3 text-cyan-400" />}
      </div>
      <span className={`text-xs transition-colors duration-200 ${checked ? 'text-cyan-400' : 'text-gray-500'}`}>
        {label}
      </span>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden" style={{ backgroundColor: '#0a0a0a' }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-bl from-cyan-500/10 via-transparent to-transparent blur-3xl animate-pulse" style={{ animationDuration: '5s' }}></div>
        <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-blue-500/10 via-transparent to-transparent blur-3xl animate-pulse" style={{ animationDuration: '7s' }}></div>
      </div>

      {showToast && (
        <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-top duration-300">
          <div className={`flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl backdrop-blur-sm ${
            toastType === 'success' ? 'bg-emerald-500/90 text-white' : 'bg-red-500/90 text-white'
          }`}>
            {toastType === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
            <span className="font-medium">{toastMessage}</span>
          </div>
        </div>
      )}

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10 animate-in fade-in slide-in-from-top duration-700">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 mb-6 shadow-lg shadow-cyan-500/50">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent mb-3">
            Join Us Today
          </h1>
          <p className="text-gray-400 text-base">Create your account and start your journey</p>
        </div>

        <div className="rounded-2xl p-8 backdrop-blur-xl shadow-2xl border border-white/10 animate-in fade-in slide-in-from-bottom duration-700"
          style={{ backgroundColor: 'rgba(20, 20, 20, 0.8)', boxShadow: '0 8px 32px rgba(0, 217, 255, 0.1)' }}>
          <div className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="fullName" className="flex items-center gap-2 text-sm font-medium text-gray-300">
                <User className={`h-4 w-4 transition-colors duration-200 ${focusedField === 'fullName' ? 'text-cyan-400' : 'text-gray-500'}`} />
                Full Name
              </label>
              <div className="relative group">
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('fullName')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="John Doe"
                  className="w-full px-4 py-3.5 rounded-xl border transition-all duration-300 bg-black/40 border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 focus:bg-black/60"
                />
                <div className={`absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-400/20 to-blue-400/20 -z-10 blur-xl transition-opacity duration-300 ${focusedField === 'fullName' ? 'opacity-100' : 'opacity-0'}`}></div>
              </div>
              {errors.fullName && (
                <div className="flex items-center gap-2 text-red-400 animate-in slide-in-from-top duration-200">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-xs">{errors.fullName}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="flex items-center gap-2 text-sm font-medium text-gray-300">
                <Mail className={`h-4 w-4 transition-colors duration-200 ${focusedField === 'email' ? 'text-cyan-400' : 'text-gray-500'}`} />
                Email Address
              </label>
              <div className="relative group">
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3.5 rounded-xl border transition-all duration-300 bg-black/40 border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 focus:bg-black/60"
                />
                <div className={`absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-400/20 to-blue-400/20 -z-10 blur-xl transition-opacity duration-300 ${focusedField === 'email' ? 'opacity-100' : 'opacity-0'}`}></div>
              </div>
              {errors.email && (
                <div className="flex items-center gap-2 text-red-400 animate-in slide-in-from-top duration-200">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-xs">{errors.email}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="flex items-center gap-2 text-sm font-medium text-gray-300">
                <Lock className={`h-4 w-4 transition-colors duration-200 ${focusedField === 'password' ? 'text-cyan-400' : 'text-gray-500'}`} />
                Password
              </label>
              <div className="relative group">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Create a strong password"
                  className="w-full px-4 py-3.5 rounded-xl border transition-all duration-300 bg-black/40 border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 focus:bg-black/60 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-cyan-400 transition-colors duration-200 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
                <div className={`absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-400/20 to-blue-400/20 -z-10 blur-xl transition-opacity duration-300 ${focusedField === 'password' ? 'opacity-100' : 'opacity-0'}`}></div>
              </div>

              {formData.password && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Password Strength</span>
                    <span className="text-xs font-medium" style={{ color: getStrengthColor() }}>
                      {getStrengthLabel()}
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full transition-all duration-500 rounded-full"
                      style={{ width: `${(getPasswordStrength() / 5) * 100}%`, backgroundColor: getStrengthColor() }}>
                    </div>
                  </div>
                </div>
              )}

              {formData.password && (
                <div className="mt-3 p-4 rounded-xl bg-black/40 border border-gray-800 space-y-2.5">
                  <PasswordCheckItem checked={passwordChecks.minLength} label="At least 8 characters" />
                  <PasswordCheckItem checked={passwordChecks.hasUpper} label="One uppercase letter" />
                  <PasswordCheckItem checked={passwordChecks.hasLower} label="One lowercase letter" />
                  <PasswordCheckItem checked={passwordChecks.hasNumber} label="One number" />
                  <PasswordCheckItem checked={passwordChecks.hasSpecial} label="One special character (!@#$%^&*)" />
                </div>
              )}

              {errors.password && (
                <div className="flex items-center gap-2 text-red-400 animate-in slide-in-from-top duration-200">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-xs">{errors.password}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="flex items-center gap-2 text-sm font-medium text-gray-300">
                <Lock className={`h-4 w-4 transition-colors duration-200 ${focusedField === 'confirmPassword' ? 'text-cyan-400' : 'text-gray-500'}`} />
                Confirm Password
              </label>
              <div className="relative group">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('confirmPassword')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Confirm your password"
                  className="w-full px-4 py-3.5 rounded-xl border transition-all duration-300 bg-black/40 border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 focus:bg-black/60 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-cyan-400 transition-colors duration-200 focus:outline-none"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
                <div className={`absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-400/20 to-blue-400/20 -z-10 blur-xl transition-opacity duration-300 ${focusedField === 'confirmPassword' ? 'opacity-100' : 'opacity-0'}`}></div>
              </div>
              {formData.confirmPassword && formData.password === formData.confirmPassword && (
                <div className="flex items-center gap-2 text-emerald-400 animate-in slide-in-from-top duration-200">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-xs">Passwords match</span>
                </div>
              )}
              {errors.confirmPassword && (
                <div className="flex items-center gap-2 text-red-400 animate-in slide-in-from-top duration-200">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-xs">{errors.confirmPassword}</span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSigningUp}
              className="relative w-full cursor-pointer py-4 rounded-xl text-base transition-all duration-300 flex items-center justify-center gap-2 overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:shadow-lg hover:shadow-cyan-500/50 hover:scale-[1.02] active:scale-[0.98] mt-6"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative z-10 flex items-center gap-2">
                {isSigningUp ? (
                  <>
                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-5 w-5" />
                    Create Account
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
                  </>
                )}
              </span>
            </button>

            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
              <span className="text-xs text-gray-500 font-medium">OR</span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-400">
                Already have an account?{' '}
                <Link href="/login" className="text-cyan-400 hover:text-cyan-300 transition-colors">
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center gap-4 text-xs text-gray-500">
          <Link href="/privacy" className="hover:text-gray-400 transition-colors">Privacy Policy</Link>
          <span>•</span>
          <Link href="/terms" className="hover:text-gray-400 transition-colors">Terms of Service</Link>
        </div>
      </div>
    </div>
  )
}

export default SignUpPage