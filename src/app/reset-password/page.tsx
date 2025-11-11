"use client";

import React, { useState } from 'react';
import { Eye, EyeOff, Lock, AlertCircle, CheckCircle2, ArrowRight, X } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/stores';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useParams } from 'next/navigation';

const ResetPasswordPage = () => {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    password: false,
    confirmPassword: false
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  
  const { resetPassword, isResettingPassword } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const resetToken = params.resetToken as string;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const togglePasswordVisibility = (field: 'password' | 'confirmPassword') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!resetToken) {
      setToastType('error');
      setToastMessage('Invalid reset token. Please request a new reset link.');
      setShowToast(true);
      return;
    }

    try {
      await resetPassword({ 
        password: formData.password, 
        resetToken 
      });
      
      setToastType('success');
      setToastMessage('Password reset successfully! Redirecting to login...');
      setShowToast(true);

      // Redirect to login after success
      setTimeout(() => {
        router.push('/login');
      }, 2000);

    } catch (error: any) {
      setToastType('error');
      setToastMessage(error.message || 'Failed to reset password. The link may have expired.');
      setShowToast(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden" style={{ backgroundColor: '#0a0a0a' }}>
      {/* Animated Background Gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-cyan-500/10 via-transparent to-transparent blur-3xl animate-pulse" style={{ animationDuration: '4s' }}></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-blue-500/10 via-transparent to-transparent blur-3xl animate-pulse" style={{ animationDuration: '6s' }}></div>
      </div>

      {/* Enhanced Toast Notification */}
      <AnimatePresence mode="wait">
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ 
              type: "spring", 
              stiffness: 500, 
              damping: 30,
              mass: 0.8
            }}
            className="fixed top-6 right-6 z-50"
          >
            <motion.div
              initial={{ boxShadow: "0 0 0 0 rgba(0, 0, 0, 0)" }}
              animate={{ 
                boxShadow: toastType === 'success' 
                  ? "0 20px 60px -10px rgba(16, 185, 129, 0.3)" 
                  : "0 20px 60px -10px rgba(239, 68, 68, 0.3)"
              }}
              className={`flex items-center gap-3 pl-5 pr-4 py-4 rounded-2xl backdrop-blur-md border min-w-[320px] ${
                toastType === 'success'
                  ? 'bg-gradient-to-r from-emerald-500/95 to-emerald-600/95 border-emerald-400/20 text-white'
                  : 'bg-gradient-to-r from-red-500/95 to-red-600/95 border-red-400/20 text-white'
              }`}
            >
              {/* Icon with animation */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 400, 
                  damping: 15,
                  delay: 0.1
                }}
              >
                {toastType === 'success' ? (
                  <div className="bg-white/20 p-1.5 rounded-full">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                ) : (
                  <div className="bg-white/20 p-1.5 rounded-full">
                    <AlertCircle className="h-5 w-5" />
                  </div>
                )}
              </motion.div>

              {/* Message */}
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
                className="font-medium flex-1 text-sm"
              >
                {toastMessage}
              </motion.span>

              {/* Close button */}
              <motion.button
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowToast(false)}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
              </motion.button>

              {/* Progress bar */}
              <motion.div
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: 4, ease: "linear" }}
                className="absolute bottom-0 left-0 right-0 h-1 bg-white/30 rounded-b-2xl origin-left"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-md relative z-10">
        {/* Logo Section */}
        <div className="text-center mb-10 animate-in fade-in slide-in-from-top duration-700">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 mb-6 shadow-lg shadow-cyan-500/50">
            <Lock className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent mb-3">
            New Password
          </h1>
          <p className="text-gray-400 text-base">Create your new password</p>
        </div>

        {/* Form Card */}
        <div 
          className="rounded-2xl p-8 backdrop-blur-xl shadow-2xl border border-white/10 animate-in fade-in slide-in-from-bottom duration-700"
          style={{ 
            backgroundColor: 'rgba(20, 20, 20, 0.8)',
            boxShadow: '0 8px 32px rgba(0, 217, 255, 0.1)'
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* New Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="flex items-center gap-2 text-sm font-medium text-gray-300">
                <Lock className={`h-4 w-4 transition-colors duration-200 ${focusedField === 'password' ? 'text-cyan-400' : 'text-gray-500'}`} />
                New Password
              </label>
              <div className="relative group">
                <input
                  id="password"
                  name="password"
                  type={showPasswords.password ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Enter new password (min. 8 characters)"
                  className="w-full px-4 py-3.5 rounded-xl border transition-all duration-300 bg-black/40 border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 focus:bg-black/60 pr-12"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('password')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-cyan-400 transition-colors duration-200 focus:outline-none"
                >
                  {showPasswords.password ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
                <div className={`absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-400/20 to-blue-400/20 -z-10 blur-xl transition-opacity duration-300 ${focusedField === 'password' ? 'opacity-100' : 'opacity-0'}`}></div>
              </div>
              {errors.password && (
                <div className="flex items-center gap-2 text-red-400 animate-in slide-in-from-top duration-200">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-xs">{errors.password}</span>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="flex items-center gap-2 text-sm font-medium text-gray-300">
                <Lock className={`h-4 w-4 transition-colors duration-200 ${focusedField === 'confirmPassword' ? 'text-cyan-400' : 'text-gray-500'}`} />
                Confirm New Password
              </label>
              <div className="relative group">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showPasswords.confirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('confirmPassword')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Confirm your new password"
                  className="w-full px-4 py-3.5 rounded-xl border transition-all duration-300 bg-black/40 border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 focus:bg-black/60 pr-12"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirmPassword')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-cyan-400 transition-colors duration-200 focus:outline-none"
                >
                  {showPasswords.confirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
                <div className={`absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-400/20 to-blue-400/20 -z-10 blur-xl transition-opacity duration-300 ${focusedField === 'confirmPassword' ? 'opacity-100' : 'opacity-0'}`}></div>
              </div>
              {errors.confirmPassword && (
                <div className="flex items-center gap-2 text-red-400 animate-in slide-in-from-top duration-200">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-xs">{errors.confirmPassword}</span>
                </div>
              )}
            </div>

            {/* Password Requirements */}
            <div className="bg-cyan-500/10 border border-cyan-400/20 rounded-xl p-4">
              <p className="text-sm text-cyan-300 text-center">
                Your password must be at least 8 characters long
              </p>
            </div>

            {/* Reset Password Button */}
            <button
              type="submit"
              disabled={isResettingPassword}
              className="relative text-sm cursor-pointer w-full py-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:shadow-lg hover:shadow-cyan-500/50 hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative z-10 flex items-center gap-2">
                {isResettingPassword ? (
                  <>
                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Resetting...
                  </>
                ) : (
                  <>
                    Reset Password
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
                  </>
                )}
              </span>
            </button>

            {/* Divider */}
            <div className="flex items-center gap-4 my-8">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
              <span className="text-xs text-gray-500 font-medium">NEED HELP?</span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
            </div>

            {/* Back to Login Link */}
            <div className="text-center">
              <p className="text-sm text-gray-400">
                Remember your password?{' '}
                <Link href="/login" className="text-cyan-400 hover:text-cyan-300 transition-colors">
                  Back to Login
                </Link>
              </p>
            </div>
          </form>
        </div>

        {/* Footer Links */}
        <div className="mt-8 flex items-center justify-center gap-4 text-xs text-gray-500">
          <Link href="/privacy" className="hover:text-gray-400 transition-colors">Privacy Policy</Link>
          <span>•</span>
          <Link href="/terms" className="hover:text-gray-400 transition-colors">Terms of Service</Link>
          <span>•</span>
          <Link href="/support" className="hover:text-gray-400 transition-colors">Support</Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;