"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToastStore, useAuthStore } from '@/stores';
import { X, Camera, User, Edit2, Check, XCircle, Trash2, AlertCircle, Mail, Calendar, UserCircle, Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AuthUser {
  fullName?: string;
  email?: string;
  profilePic?: string;
  about?: string;
  createdAt?: string | Date;
}

interface PasswordChecks {
  minLength: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
  hasUpper: boolean;
  hasLower: boolean;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [selectedImg, setSelectedImg] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [about, setAbout] = useState('');
  const [originalAbout, setOriginalAbout] = useState('');
  
  // Delete Account States
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');

  // Change Password States
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [changePasswordData, setChangePasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [changePasswordError, setChangePasswordError] = useState('');
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [passwordChecks, setPasswordChecks] = useState<PasswordChecks>({
    minLength: false,
    hasNumber: false,
    hasSpecial: false,
    hasUpper: false,
    hasLower: false
  });
  const [focusedPasswordField, setFocusedPasswordField] = useState<string | null>(null);

  const { authUser, updateProfile, isUpdating, deleteAccount, isDeleting, changePassword, isChangingPassword } = useAuthStore();
  const { showToast } = useToastStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync about field
  useEffect(() => {
    if (authUser?.about !== undefined) {
      setAbout(authUser.about || '');
      setOriginalAbout(authUser.about || '');
    }
  }, [authUser?.about, isOpen]);

  // Reset delete modal
  useEffect(() => {
    if (!showDeleteConfirm) {
      setDeletePassword('');
      setDeleteError('');
    }
  }, [showDeleteConfirm]);

  // Reset change password modal
  useEffect(() => {
    if (!showChangePassword) {
      setChangePasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setChangePasswordError('');
      setShowPasswords({
        current: false,
        new: false,
        confirm: false
      });
      setPasswordChecks({
        minLength: false,
        hasNumber: false,
        hasSpecial: false,
        hasUpper: false,
        hasLower: false
      });
    }
  }, [showChangePassword]);

  // Validate password when newPassword changes
  useEffect(() => {
    validatePassword(changePasswordData.newPassword);
  }, [changePasswordData.newPassword]);

  const validatePassword = (pass: string) => {
    setPasswordChecks({
      minLength: pass.length >= 8,
      hasNumber: /\d/.test(pass),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(pass),
      hasUpper: /[A-Z]/.test(pass),
      hasLower: /[a-z]/.test(pass)
    });
  };

  const isPasswordValid = (): boolean => {
    return Object.values(passwordChecks).every(check => check === true);
  };

  const getPasswordStrength = (): number => {
    return Object.values(passwordChecks).filter(Boolean).length;
  };

  const getStrengthColor = (): string => {
    const strength = getPasswordStrength();
    if (strength <= 2) return '#ef4444';
    if (strength <= 3) return '#f59e0b';
    if (strength === 4) return '#10b981';
    return '#00d9ff';
  };

  const getStrengthLabel = (): string => {
    const strength = getPasswordStrength();
    if (strength === 0) return '';
    if (strength <= 2) return 'Weak';
    if (strength <= 3) return 'Fair';
    if (strength === 4) return 'Good';
    return 'Strong';
  };

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
  );

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onloadend = async () => {
      const base64Image = reader.result as string;
      setSelectedImg(base64Image);

      try {
        await updateProfile({ profilePic: base64Image });
        showToast("Profile picture updated!", "success");
      } catch (error) {
        showToast("Failed to update profile picture.", "error");
        setSelectedImg(null);
      }
    };
  };

  const handleSaveAbout = async () => {
    if (about.trim() === originalAbout) {
      setIsEditing(false);
      return;
    }

    try {
      await updateProfile({ about: about.trim() });
      setOriginalAbout(about.trim());
      setIsEditing(false);
      showToast("About section updated!", "success");
    } catch (error) {
      showToast("Failed to update about section.", "error");
    }
  };

  const handleCancelEdit = () => {
    setAbout(originalAbout);
    setIsEditing(false);
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword.trim()) {
      setDeleteError('Password is required');
      return;
    }

    try {
      await deleteAccount({ password: deletePassword });
      showToast("Account deleted successfully. Goodbye!", "success");
      setShowDeleteConfirm(false);
      onClose();
    } catch (error: any) {
      setDeleteError(error.message || 'Incorrect password or server error');
    }
  };

  const handleChangePassword = async () => {
    // Validation
    if (!changePasswordData.currentPassword || !changePasswordData.newPassword || !changePasswordData.confirmPassword) {
      setChangePasswordError('All fields are required');
      return;
    }

    if (!isPasswordValid()) {
      setChangePasswordError('New password does not meet all requirements');
      return;
    }

    if (changePasswordData.newPassword !== changePasswordData.confirmPassword) {
      setChangePasswordError('New passwords do not match');
      return;
    }

    if (changePasswordData.currentPassword === changePasswordData.newPassword) {
      setChangePasswordError('New password must be different from current password');
      return;
    }

    try {
      await changePassword({
        currentPassword: changePasswordData.currentPassword,
        newPassword: changePasswordData.newPassword
      });
      
      showToast("Password changed successfully!", "success");
      setShowChangePassword(false);
      
      // Reset form
      setChangePasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setChangePasswordError('');
    } catch (error: any) {
      setChangePasswordError(error.message || 'Failed to change password');
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const getProfilePic = () => selectedImg || authUser?.profilePic;

  const joinDate = authUser?.createdAt
    ? format(new Date(authUser.createdAt), 'MMMM d, yyyy')
    : 'Unknown';

  const handleClose = () => {
    if (isEditing && about.trim() !== originalAbout) {
      const confirm = window.confirm("You have unsaved changes. Close anyway?");
      if (!confirm) return;
    }
    setIsEditing(false);
    setSelectedImg(null);
    setShowDeleteConfirm(false);
    setShowChangePassword(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-50"
          />

          {/* Main Modal */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 30, stiffness: 400 }}
            onClick={(e) => e.stopPropagation()}
            className="fixed inset-x-0 top-0 max-w-lg mx-auto md:mt-8 h-screen  md:h-auto md:max-h-[92vh] bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f] z-50 flex flex-col  overflow-hidden shadow-2xl border border-[#2a2a2a]/50"
          >
            {/* Header with gradient accent */}
            <div className="relative">
              <div className="absolute inset-0 bg-[#1e1e1e] border-b border-[#2a2a2a]" />
              <div className="relative flex items-center justify-between p-4">
                <button
                  onClick={handleClose}
                  className="p-2 rounded-xl cursor-pointer hover:bg-white/5 active:scale-95 transition-all duration-200"
                  aria-label="Close settings"
                >
                  <X className="w-5 h-5 text-white/90" />
                </button>
                <h2 className="text-xl font-bold text-white tracking-tight">Profile Settings</h2>
                <div className="w-9" />
              </div>
              <div className="h-[1px] bg-gradient-to-r from-transparent via-[#00d9ff]/30 to-transparent" />
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6 py-8 space-y-8 scrollbar-thin scrollbar-thumb-[#2a2a2a] scrollbar-track-transparent">
              {/* Profile Picture Section */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative group">
                  <button
                    onClick={() => !isUpdating && fileInputRef.current?.click()}
                    disabled={isUpdating}
                    className="size-28 rounded-full cursor-pointer overflow-hidden ring-4 ring-[#2a2a2a] hover:ring-[#00d9ff]/50 transition-all duration-300 focus:outline-none focus:ring-[#00d9ff] relative"
                    aria-label="Change profile picture"
                  >
                    {isUpdating ? (
                      <div className="size-full bg-gradient-to-br from-[#1e1e1e] to-[#0f0f0f] flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#00d9ff] border-t-transparent"></div>
                      </div>
                    ) : getProfilePic() ? (
                      <img src={getProfilePic()!} alt="Profile" className="size-full object-cover" />
                    ) : (
                      <div className="size-full bg-gradient-to-br from-[#1e1e1e] to-[#0f0f0f] flex items-center justify-center">
                        <User className="w-14 h-14 text-[#666666]" />
                      </div>
                    )}
                    
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full flex items-center justify-center backdrop-blur-sm">
                      <div className="flex flex-col items-center gap-1">
                        <Camera className="w-6 h-6 text-white" />
                        <span className="text-xs text-white font-medium">Change</span>
                      </div>
                    </div>
                  </button>

                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={isUpdating}
                  />
                </div>
                
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-white mb-1">
                    {authUser?.fullName || 'Anonymous User'}
                  </h3>
                  <p className="text-sm text-[#999999]">Manage your account settings</p>
                </div>
              </div>

              {/* User Info Cards */}
              <div className="space-y-3">
                <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-[#2a2a2a] hover:border-[#00d9ff]/30 transition-colors duration-300">
                  <div className="flex items-start gap-3">
                    <div className="">
                      <UserCircle className="w-5 h-5 text-[#00d9ff]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <label className="text-xs cursor-pointer text-[#999999] uppercase tracking-wider block mb-1">
                        Full Name
                      </label>
                      <p className="text-white text-sm font-medium truncate">
                        {authUser?.fullName || 'Not set'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-[#2a2a2a] hover:border-[#00d9ff]/30 transition-colors duration-300">
                  <div className="flex items-start gap-3">
                    <div className="">
                      <Mail className="w-5 h-5 text-[#00d9ff]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <label className="text-xs cursor-pointer text-[#999999] uppercase tracking-wider block mb-1">
                        Email Address
                      </label>
                      <p className="text-white text-sm truncate">
                        {authUser?.email || 'Not set'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-[#2a2a2a] hover:border-[#00d9ff]/30 transition-colors duration-300">
                  <div className="flex items-start gap-3">
                    <div className="">
                      <Calendar className="w-5 h-5 text-[#00d9ff]" />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs cursor-pointer text-[#999999] uppercase tracking-wider block mb-1">
                        Member Since
                      </label>
                      <p className="text-white text-sm">{joinDate}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs cursor-pointer text-[#999999] uppercase tracking-wider flex items-center gap-2">
                    <div className="w-1 h-4 bg-[#00d9ff] rounded-full" />
                    Security
                  </label>
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setShowChangePassword(true)}
                  className="w-full bg-[#1a1a1a] rounded-2xl p-4 border border-[#2a2a2a] hover:border-[#00d9ff]/30 transition-colors duration-300 text-left cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#00d9ff]/10 rounded-xl">
                        <Lock className="w-4 h-4 text-[#00d9ff]" />
                      </div>
                      <div>
                        <h4 className="text-white text-sm font-medium">Change Password</h4>
                        <p className="text-[#999999] text-xs">Update your account password</p>
                      </div>
                    </div>
                    <div className="p-2 rounded-xl bg-white/5 group-hover:bg-[#00d9ff]/10 transition-colors">
                      <Edit2 className="w-4 h-4 text-[#999999] group-hover:text-[#00d9ff]" />
                    </div>
                  </div>
                </motion.button>
              </div>

              {/* About Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs cursor-pointer text-[#999999] uppercase tracking-wider flex items-center gap-2">
                    <div className="w-1 h-4 bg-[#00d9ff] rounded-full" />
                    About Me
                  </label>
                  {!isEditing && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIsEditing(true)}
                      className="text-[#00d9ff] text-sm font-medium cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-[#00d9ff]/10 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Edit
                    </motion.button>
                  )}
                </div>

                {isEditing ? (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3"
                  >
                    <div className="relative">
                      <textarea
                        value={about}
                        onChange={(e) => setAbout(e.target.value)}
                        placeholder="Tell us about yourself..."
                        rows={4}
                        maxLength={160}
                        className="w-full px-4 py-3 bg-[#0f0f0f] border-2 border-[#2a2a2a] rounded-xl text-white placeholder-[#666666] text-sm focus:outline-none focus:border-[#00d9ff] resize-none transition-colors"
                        autoFocus
                      />
                      <div className="absolute bottom-3 right-3 text-xs">
                        <span className={`font-medium transition-colors ${
                          about.length > 150 ? 'text-red-400' : about.length > 140 ? 'text-yellow-400' : 'text-[#666666]'
                        }`}>
                          {about.length}/160
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleCancelEdit}
                        className="flex-1 px-4 py-2.5 rounded-xl cursor-pointer bg-[#1a1a1a] border border-[#2a2a2a] text-white hover:bg-[#252525] transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                      >
                        <XCircle className="w-4 h-4" />
                        Cancel
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSaveAbout}
                        disabled={isUpdating}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-[#00d9ff] text-black cursor-pointer hover:bg-[#00c0e0] transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#00d9ff]/20"
                      >
                        {isUpdating ? (
                          <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                        Save Changes
                      </motion.button>
                    </div>
                  </motion.div>
                ) : (
                  <div className="bg-[#1a1a1a] rounded-xl p-4 border border-[#2a2a2a] min-h-[5rem] hover:border-[#00d9ff]/30 transition-colors duration-300">
                    <p className="text-white/90 text-sm leading-relaxed">
                      {authUser?.about || (
                        <span className="text-[#666666] italic flex items-center gap-2">
                          <Edit2 className="w-4 h-4" />
                          No bio yet. Click edit to add one.
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </div>

              {/* Delete Account Section */}
              <div className="border-t border-[#2a2a2a] pt-6 mt-8">
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider">
                    Danger Zone
                  </h3>
                </div>
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isDeleting}
                  className="w-full px-4 py-3 cursor-pointer bg-red-500/5 border-2 border-red-500/30 text-red-400 rounded-xl hover:bg-red-500/10 hover:border-red-500/50 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 group"
                >
                  <Trash2 className="w-4 h-4 group-hover:animate-pulse" />
                  Delete Account Permanently
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Change Password Modal */}
          <AnimatePresence>
            {showChangePassword && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center p-4"
                onClick={() => setShowChangePassword(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 20 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-gradient-to-b from-[#1a1a1a] overflow-y-auto to-[#0f0f0f] md:h-[500px] rounded-2xl p-6 max-w-md w-full border-2 border-[#00d9ff]/30 shadow-2xl shadow-[#00d9ff]/10"
                >
                  <div className="flex items-start gap-3 mb-6">
                    <div className="p-2 bg-[#00d9ff]/10 rounded-xl">
                      <Lock className="w-6 h-6 text-[#00d9ff]" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Change Password</h3>
                      <p className="text-sm text-[#999999] mt-1">Update your account password</p>
                    </div>
                  </div>

                  <div className="space-y-4 ">
                    {/* Current Password */}
                    <div>
                      <label className="text-xs cursor-pointer text-[#999999] uppercase tracking-wider block mb-2">
                        Current Password
                      </label>
                      <div className="relative group">
                        <input
                          type={showPasswords.current ? "text" : "password"}
                          value={changePasswordData.currentPassword}
                          onChange={(e) => {
                            setChangePasswordData(prev => ({ ...prev, currentPassword: e.target.value }));
                            setChangePasswordError('');
                          }}
                          onFocus={() => setFocusedPasswordField('current')}
                          onBlur={() => setFocusedPasswordField(null)}
                          placeholder="Enter current password"
                          className="w-full px-4 py-3 bg-[#0f0f0f] border-2 border-[#2a2a2a] rounded-xl text-white placeholder-[#666666] text-sm focus:outline-none focus:border-[#00d9ff] transition-colors pr-12"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('current')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#666666] hover:text-white transition-colors"
                        >
                          {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <div className={`absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-400/20 to-blue-400/20 -z-10 blur-xl transition-opacity duration-300 ${focusedPasswordField === 'current' ? 'opacity-100' : 'opacity-0'}`}></div>
                      </div>
                    </div>

                    {/* New Password */}
                    <div>
                      <label className="text-xs cursor-pointer text-[#999999] uppercase tracking-wider block mb-2">
                        New Password
                      </label>
                      <div className="relative group">
                        <input
                          type={showPasswords.new ? "text" : "password"}
                          value={changePasswordData.newPassword}
                          onChange={(e) => {
                            setChangePasswordData(prev => ({ ...prev, newPassword: e.target.value }));
                            setChangePasswordError('');
                          }}
                          onFocus={() => setFocusedPasswordField('new')}
                          onBlur={() => setFocusedPasswordField(null)}
                          placeholder="Enter new password (min. 8 characters)"
                          className="w-full px-4 py-3 bg-[#0f0f0f] border-2 border-[#2a2a2a] rounded-xl text-white placeholder-[#666666] text-sm focus:outline-none focus:border-[#00d9ff] transition-colors pr-12"
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('new')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#666666] hover:text-white transition-colors"
                        >
                          {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <div className={`absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-400/20 to-blue-400/20 -z-10 blur-xl transition-opacity duration-300 ${focusedPasswordField === 'new' ? 'opacity-100' : 'opacity-0'}`}></div>
                      </div>

                      {changePasswordData.newPassword && (
                        <div className="space-y-2 mt-3">
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

                      {changePasswordData.newPassword && (
                        <div className="mt-3 p-4 rounded-xl bg-black/40 border border-gray-800 space-y-2.5">
                          <PasswordCheckItem checked={passwordChecks.minLength} label="At least 8 characters" />
                          <PasswordCheckItem checked={passwordChecks.hasUpper} label="One uppercase letter" />
                          <PasswordCheckItem checked={passwordChecks.hasLower} label="One lowercase letter" />
                          <PasswordCheckItem checked={passwordChecks.hasNumber} label="One number" />
                          <PasswordCheckItem checked={passwordChecks.hasSpecial} label="One special character (!@#$%^&*)" />
                        </div>
                      )}
                    </div>

                    {/* Confirm New Password */}
                    <div>
                      <label className="text-xs cursor-pointer text-[#999999] uppercase tracking-wider block mb-2">
                        Confirm New Password
                      </label>
                      <div className="relative group">
                        <input
                          type={showPasswords.confirm ? "text" : "password"}
                          value={changePasswordData.confirmPassword}
                          onChange={(e) => {
                            setChangePasswordData(prev => ({ ...prev, confirmPassword: e.target.value }));
                            setChangePasswordError('');
                          }}
                          onFocus={() => setFocusedPasswordField('confirm')}
                          onBlur={() => setFocusedPasswordField(null)}
                          placeholder="Confirm new password"
                          className="w-full px-4 py-3 bg-[#0f0f0f] border-2 border-[#2a2a2a] rounded-xl text-white placeholder-[#666666] text-sm focus:outline-none focus:border-[#00d9ff] transition-colors pr-12"
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('confirm')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#666666] hover:text-white transition-colors"
                        >
                          {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <div className={`absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-400/20 to-blue-400/20 -z-10 blur-xl transition-opacity duration-300 ${focusedPasswordField === 'confirm' ? 'opacity-100' : 'opacity-0'}`}></div>
                      </div>
                      {changePasswordData.confirmPassword && changePasswordData.newPassword === changePasswordData.confirmPassword && (
                        <div className="flex items-center gap-2 text-emerald-400 animate-in slide-in-from-top duration-200 mt-2">
                          <CheckCircle2 className="h-4 w-4" />
                          <span className="text-xs">Passwords match</span>
                        </div>
                      )}
                    </div>

                    {/* Error Message */}
                    <AnimatePresence>
                      {changePasswordError && (
                        <motion.p
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="text-xs text-red-400 flex items-center gap-1.5 bg-red-500/10 px-3 py-2 rounded-lg"
                        >
                          <AlertCircle className="w-3.5 h-3.5" />
                          {changePasswordError}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowChangePassword(false)}
                      className="flex-1 px-4 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-xl hover:bg-[#252525] transition-colors text-sm cursor-pointer"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleChangePassword}
                      disabled={isChangingPassword || !isPasswordValid()}
                      className="flex-1 px-4 py-2.5 bg-[#00d9ff] text-black rounded-xl hover:bg-[#00c0e0] transition-colors text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-[#00d9ff]/20"
                    >
                      {isChangingPassword ? (
                        <>
                          <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                          Changing...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          Change Password
                        </>
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Delete Confirmation Modal */}
          <AnimatePresence>
            {showDeleteConfirm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center p-4"
                onClick={() => setShowDeleteConfirm(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 20 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-6 max-w-md w-full border-2 border-red-500/30 shadow-2xl shadow-red-500/10"
                >
                  <div className="flex items-start gap-3 mb-4">
                    <div className="p-2 bg-red-500/10 rounded-xl">
                      <AlertCircle className="w-6 h-6 text-red-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Delete Account?</h3>
                  </div>

                  <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 mb-5">
                    <p className="text-sm text-white/90 leading-relaxed">
                      This action <strong className="text-red-400">cannot be undone</strong>. All your data, messages, and account information will be <strong>permanently deleted</strong>.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs cursor-pointer text-[#999999] uppercase tracking-wider">
                      Confirm with your password
                    </label>
                    <input
                      type="password"
                      value={deletePassword}
                      onChange={(e) => {
                        setDeletePassword(e.target.value);
                        setDeleteError('');
                      }}
                      placeholder="Enter your password"
                      className="w-full px-4 py-3 bg-[#0f0f0f] border-2 border-[#2a2a2a] rounded-xl text-white placeholder-[#666666] text-sm focus:outline-none focus:border-red-500 transition-colors"
                      autoFocus
                    />
                    <AnimatePresence>
                      {deleteError && (
                        <motion.p
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="text-xs text-red-400 flex items-center gap-1.5 bg-red-500/10 px-3 py-2 rounded-lg"
                        >
                          <AlertCircle className="w-3.5 h-3.5" />
                          {deleteError}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 px-4 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-xl hover:bg-[#252525] transition-colors text-sm cursor-pointer"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleDeleteAccount}
                      disabled={isDeleting || !deletePassword}
                      className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-red-600/20"
                    >
                      {isDeleting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" />
                          Delete Forever
                        </>
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SettingsModal;