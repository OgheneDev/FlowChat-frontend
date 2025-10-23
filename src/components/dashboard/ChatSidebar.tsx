"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useChatStore } from '@/stores/useChatStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { Bell, Settings, LogOut, Search, X, User, Camera, Users, MessageCircle } from 'lucide-react';
import { TabContent } from './TabContent';
import { Toast } from '../ui/toast';
import Swal from 'sweetalert2';

type Tab = "chats" | "contacts" | "groups";

interface AuthUser {
  profilePic?: string;
}

interface ChatStore {
  setActiveTab: (tab: Tab) => void;
  contacts: any[];
  groups: any[];
  chats: any[];
  getAllContacts: () => void;
  getChatPartners: () => void;
  getMyGroups: () => void;
  isLoading: boolean;
  selectedUser: any;
  setSelectedUser: (user: any) => void;
}

interface AuthStore {
  logout: () => void;
  authUser?: AuthUser;
  updateProfile: (data: { profilePic: string }) => Promise<void>;
  isUpdating: boolean;
}

const ChatSidebar = () => {
  const [activeTab, setActiveTab] = useState<Tab>("chats");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedImg, setSelectedImg] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const {
    setActiveTab: setStoreActiveTab,
    contacts,
    groups,
    chats,
    getAllContacts,
    getChatPartners,
    getMyGroups,
    isLoading,
    selectedUser,
    setSelectedUser
  } = useChatStore() as ChatStore;

  const { logout, authUser, updateProfile, isUpdating } = useAuthStore() as AuthStore;

  const fileInputRef = useRef<HTMLInputElement>(null);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'chats', label: 'Chats', icon: <MessageCircle className="w-4 h-4" /> },
    { id: 'contacts', label: 'Contacts', icon: <User className="w-4 h-4" /> },
    { id: 'groups', label: 'Groups', icon: <Users className="w-4 h-4" /> },
  ];

  useEffect(() => {
    if (authUser) {
      getAllContacts();
      getChatPartners();
      getMyGroups();
    }
  }, [authUser, getAllContacts, getChatPartners, getMyGroups]);

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setStoreActiveTab(tab);
    if (activeTab === 'chats' && selectedUser) {
      setSelectedUser(null);
    }
  };

  const filterList = (items: any[], searchFields: string[]) => {
    if (!searchQuery.trim()) return items;
    return items.filter((item) =>
      searchFields.some((field) =>
        item[field]?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  };

  const filteredChats = filterList(chats || [], ['fullName']);
  const filteredContacts = filterList(contacts || [], ['fullName']);
  const filteredGroups = filterList(groups || [], ['name']);

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
        setToastMessage('Profile picture updated successfully!');
        setToastType('success');
        setShowToast(true);
      } catch (error) {
        setSelectedImg(authUser?.profilePic || null);
        setToastMessage('Failed to update profile picture.');
        setToastType('error');
        setShowToast(true);
      }
    };
  };

  const getProfileImage = () => selectedImg || authUser?.profilePic;

  const handleLogout = () => {
    Swal.fire({
      title: 'Log out?',
      text: 'You will be signed out of your account.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Log out',
      cancelButtonText: 'Cancel',
      background: '#1e1e1e',
      color: '#F9FAFB',
      confirmButtonColor: '#06B6D4',
      cancelButtonColor: '#ef4444',
      customClass: {
        popup: 'border border-[#2a2a2a] rounded-xl',
      }
    }).then((result) => {
      if (result.isConfirmed) logout();
    });
  };

  return (
    <div className="bg-[#121212] md:w-96 text-[#ffffff] h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between p-5 border-b border-[#2a2a2a]">
        <div className="relative group">
          <button
            onClick={() => !isUpdating && fileInputRef.current?.click()}
            disabled={isUpdating}
            className="size-14 rounded-full overflow-hidden ring-2 ring-transparent focus:ring-[#00d9ff] transition-all duration-200"
            aria-label="Change profile picture"
          >
            {isUpdating ? (
              <div className="size-full bg-[#1e1e1e] flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#00d9ff] border-t-transparent"></div>
              </div>
            ) : getProfileImage() ? (
              <img src={getProfileImage()!} alt="Profile" className="size-full object-cover" />
            ) : (
              <div className="size-full bg-[#1e1e1e] flex items-center justify-center">
                <User className="w-8 h-8 text-[#999999]" />
              </div>
            )}
          </button>

          {/* Camera Overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-full flex items-center justify-center pointer-events-none">
            <Camera className="w-5 h-5 text-white" />
          </div>

          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleImageUpload}
            className="hidden"
            disabled={isUpdating}
          />
        </div>

        <div className="flex gap-1.5">
          {[
            { Icon: Bell, label: "Notifications" },
            { Icon: Settings, label: "Settings" },
            { Icon: LogOut, label: "Logout", onClick: handleLogout },
          ].map(({ Icon, label, onClick }) => (
            <button
              key={label}
              onClick={onClick}
              aria-label={label}
              className="p-2 rounded-lg hover:bg-[#1e1e1e] transition-all duration-200 group"
            >
              <Icon className="w-5 h-5 text-[#999999] group-hover:text-white transition-colors" />
            </button>
          ))}
        </div>
      </header>

      {/* Search */}
      <div className="p-4 border-b border-[#2a2a2a] bg-[#121212] sticky top-0 z-20">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999999] pointer-events-none" />
          <input
            type="text"
            placeholder="Search chats, contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl text-sm text-white placeholder-[#999999] focus:outline-none focus:border-[#00d9ff] focus:ring-2 focus:ring-[#00d9ff]/20 transition-all duration-200"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-[#2a2a2a] transition-colors"
              aria-label="Clear search"
            >
              <X className="w-4 h-4 text-[#999999]" />
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <nav className="flex border-b border-[#2a2a2a] bg-[#121212]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`flex-1 cursor-pointer flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-all duration-200 relative ${
              activeTab === tab.id
                ? 'text-[#00d9ff]'
                : 'text-[#999999] hover:text-white'
            }`}
            aria-current={activeTab === tab.id ? 'page' : undefined}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00d9ff]" />
            )}
          </button>
        ))}
      </nav>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-[#121212]">
        <TabContent
          isLoading={isLoading}
          activeTab={activeTab}
          filteredChats={filteredChats}
          filteredContacts={filteredContacts}
          filteredGroups={filteredGroups}
        />
      </div>

      {/* Toast */}
      <Toast
        show={showToast}
        message={toastMessage}
        type={toastType}
        onClose={() => setShowToast(false)}
        duration={3000}
      />
    </div>
  );
};

export default ChatSidebar;