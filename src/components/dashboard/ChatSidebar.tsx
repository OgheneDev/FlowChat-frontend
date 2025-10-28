"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useUIStore, useContactStore, useGroupStore, usePrivateChatStore, useStarringStore } from '@/stores';
import { Tab } from '@/stores';
import { useAuthStore } from '@/stores/useAuthStore';
import { Bell, Settings, LogOut, Search, X, User, Camera, Users, MessageCircle } from 'lucide-react';
import { TabContent } from './TabContent';
import { Toast } from '../ui/toast';
import Swal from 'sweetalert2';

interface AuthUser {
  profilePic?: string;
}

const ChatSidebar = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedImg, setSelectedImg] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  // UI Store
  const { activeTab, setActiveTab, setSelectedUser } = useUIStore();
 
  // Contact Store
  const { contacts, isLoading: isContactsLoading, getAllContacts } = useContactStore();

  // Private Chats Store
  const { chats, isLoading: isChatsLoading, getChatPartners } = usePrivateChatStore();

  // Group Store
  const { groups, isLoading: isGroupsLoading, getMyGroups } = useGroupStore();

  // Auth Store
  const { logout, authUser, updateProfile, isUpdating } = useAuthStore() as any;

  const fileInputRef = useRef<HTMLInputElement>(null);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'chats', label: 'Chats', icon: <MessageCircle className="w-4 h-4" /> },
    { id: 'contacts', label: 'Contacts', icon: <User className="w-4 h-4" /> },
    { id: 'groups', label: 'Groups', icon: <Users className="w-4 h-4" /> },
  ];

  // In ChatSidebar component, add this effect to refresh when starring changes
const { starredChats } = useStarringStore();

useEffect(() => {
  // This will trigger a re-render and re-sort when starredChats changes
}, [starredChats]);

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
    if (tab !== 'chats') {
      setSelectedUser(null);
    }
  };

// Replace your current sortByLastMessage function with this:
const sortByLastMessage = (items: any[], type: 'chats' | 'contacts' | 'groups') => {
  // Get starred chats from the store
  const { starredChats } = useStarringStore.getState();
  
  return items.sort((a, b) => {
    // Check if items are starred
    const aIsStarred = starredChats.includes(a._id);
    const bIsStarred = starredChats.includes(b._id);
    
    // Starred items always come first
    if (aIsStarred && !bIsStarred) return -1;
    if (!aIsStarred && bIsStarred) return 1;
    
    // For chats and groups, use lastMessage.createdAt for non-starred items
    if (type === 'chats' || type === 'groups') {
      const aTime = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const bTime = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
      return bTime - aTime; // Most recent first
    }
    
    // For contacts, you might want different sorting (alphabetical, online status, etc.)
    if (type === 'contacts') {
      return a.fullName?.localeCompare(b.fullName || '') || 0;
    }
    
    return 0;
  });
};

const filterList = (items: any[], searchFields: string[], type: 'chats' | 'contacts' | 'groups') => {
  if (!searchQuery.trim()) return sortByLastMessage([...items], type);
  const filtered = items.filter((item) =>
    searchFields.some((field) =>
      item[field]?.toString().toLowerCase().includes(searchQuery.toLowerCase())
    )
  );
  return sortByLastMessage(filtered, type);
};

// Apply with type parameter
const filteredChats = filterList(chats || [], ['fullName'], 'chats');
const filteredContacts = filterList(contacts || [], ['fullName'], 'contacts');
const filteredGroups = filterList(groups || [], ['name'], 'groups');

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

  const isLoading = isContactsLoading || isChatsLoading || isGroupsLoading;

  return (
    <div className="bg-[#121212] md:w-96 text-[#ffffff] h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between p-5 border-b border-[#2a2a2a]">
        <div className="relative group">
          <button
            onClick={() => !isUpdating && fileInputRef.current?.click()}
            disabled={isUpdating}
            className="size-14 rounded-full cursor-pointer overflow-hidden ring-2 ring-transparent focus:ring-[#00d9ff] transition-all duration-200"
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
              className="p-2 rounded-lg cursor-pointer hover:bg-[#1e1e1e] transition-all duration-200 group"
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