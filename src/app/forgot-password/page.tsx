"use client";

import React, { useState } from 'react';
import { Mail, AlertCircle, CheckCircle2, ArrowRight, X, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/stores';
import { motion, AnimatePresence } from 'framer-motion';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  
  const { forgotPassword, isSendingResetEmail } = useAuthStore();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setEmail(value);
    
    if (errors.email) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.email;
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await forgotPassword({ email });
      setToastType('success');
      setToastMessage('If an account with that email exists, a reset link has been sent. Check your inbox!');
      setShowToast(true);
      setEmail('');
    } catch (error: any) {
      // For security, we still show success even if there's an error
      setToastType('success');
      setToastMessage('If an account with that email exists, a reset link has been sent. Check your inbox!');
      setShowToast(true);
      setEmail('');
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
                transition={{ duration: 6, ease: "linear" }}
                className="absolute bottom-0 left-0 right-0 h-1 bg-white/30 rounded-b-2xl origin-left"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full max-w-md relative z-10">
        {/* Back Button */}
        <Link 
          href="/login" 
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-cyan-400 transition-colors mb-8 group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform duration-200" />
          Back to Login
        </Link>

        {/* Logo Section */}
        <div className="text-center mb-10 animate-in fade-in slide-in-from-top duration-700">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 mb-6 shadow-lg shadow-cyan-500/50">
            <Mail className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent mb-3">
            Reset Password
          </h1>
          <p className="text-gray-400 text-base">Enter your email to receive a reset link</p>
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
            {/* Email Field */}
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
                  value={email}
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

            {/* Info Text */}
            <div className="bg-cyan-500/10 border border-cyan-400/20 rounded-xl p-4">
              <p className="text-sm text-cyan-300 text-center">
                We'll send you a link to reset your password. Check your inbox and spam folder.
              </p>
            </div>

            {/* Send Reset Link Button */}
            <button
              type="submit"
              disabled={isSendingResetEmail}
              className="relative text-sm cursor-pointer w-full py-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:shadow-lg hover:shadow-cyan-500/50 hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative z-10 flex items-center gap-2">
                {isSendingResetEmail ? (
                  <>
                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    Send Reset Link
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
                  </>
                )}
              </span>
            </button>

            {/* Divider */}
            <div className="flex items-center gap-4 my-8">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent"></div>
              <span className="text-xs text-gray-500 font-medium">OR</span>
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

export default ForgotPasswordPage;