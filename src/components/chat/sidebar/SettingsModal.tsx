"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToastStore, useAuthStore } from '@/stores';
import { X, Trash2, AlertCircle, Mail, Calendar, UserCircle, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { PasswordChecks } from '@/types/types';
import ProfilePictureSection from './settings/ProfilePictureSection'
import SecuritySection from './settings/SecuritySection';
import AboutSection from './settings/AboutSection';
import DeleteAccountModal from './settings/DeleteAccountModal';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
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
              
              {/* Profile Picture Section (moved to component) */}
              <ProfilePictureSection
                authUser={authUser}
                selectedImg={selectedImg}
                fileInputRef={fileInputRef}
                isUpdating={isUpdating}
                handleImageUpload={handleImageUpload}
                getProfilePic={getProfilePic}
              />

              {/* User Info Cards (unchanged) */}
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

              {/* Security Section (includes change password modal) */}
              <SecuritySection
                showChangePassword={showChangePassword}
                setShowChangePassword={setShowChangePassword}
                changePasswordData={changePasswordData}
                setChangePasswordData={setChangePasswordData}
                changePasswordError={changePasswordError}
                setChangePasswordError={setChangePasswordError}
                showPasswords={showPasswords}
                togglePasswordVisibility={togglePasswordVisibility}
                passwordChecks={passwordChecks}
                validatePassword={validatePassword}
                isChangingPassword={isChangingPassword}
                handleChangePassword={handleChangePassword}
                getPasswordStrength={getPasswordStrength}
                getStrengthColor={getStrengthColor}
                getStrengthLabel={getStrengthLabel}
              />

              {/* About Section */}
              <AboutSection
                about={about}
                setAbout={setAbout}
                isEditing={isEditing}
                setIsEditing={setIsEditing}
                handleSaveAbout={handleSaveAbout}
                handleCancelEdit={handleCancelEdit}
                isUpdating={isUpdating}
                originalAbout={originalAbout}
              />

              {/* Delete Account / Danger Zone Section (main button) */}
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

          {/* Change Password Modal moved into SecuritySection - Delete Account modal moved below */}
          <DeleteAccountModal
            isOpen={showDeleteConfirm}
            onClose={() => setShowDeleteConfirm(false)}
            deletePassword={deletePassword}
            setDeletePassword={setDeletePassword}
            deleteError={deleteError}
            handleDeleteAccount={handleDeleteAccount}
            isDeleting={isDeleting}
          />
        </div>
      )}
    </AnimatePresence>
  );
};

export default SettingsModal;