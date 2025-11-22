"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useUIStore, useContactStore, useGroupStore, usePrivateChatStore, useStarringStore, useAuthStore } from '@/stores';
import { Tab } from '@/stores';
import { axiosInstance } from '@/api/axios';  
import { useToastStore } from '@/stores';
import { MessageCircle, User, Users } from 'lucide-react';

import SidebarHeader from './SidebarHeader'
import SearchBar from './SearchBar'
import SidebarTabs from './SidebarTabs'
import { TabContent } from './TabContent';
import ConfirmModal from './ConfirmModal';
import CreateGroupModal from './CreateGroupModal';
import SettingsModal from './SettingsModal';

interface AuthUser {
  profilePic?: string;
}

interface SearchResults {
  users: any[];
  groups: any[];
  messages: any[];
}

const ChatSidebar = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedImg, setSelectedImg] = useState<string | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  // UI Store
  const { activeTab, setActiveTab, setSelectedUser } = useUIStore();
 
  // Contact Store
  const { contacts, isLoading: isContactsLoading, getAllContacts } = useContactStore();

  // Private Chats Store
  const { chats, isLoading: isChatsLoading, getChatPartners } = usePrivateChatStore();

  // Group Store
  const { groups, isLoading: isGroupsLoading, getMyGroups } = useGroupStore();

  // Auth Store
  const { logout, authUser, updateProfile, isUpdating } = useAuthStore();

  // Toast Store
  const { showToast } = useToastStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchDropdownRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [ 
    { id: 'chats', label: 'Chats', icon: <MessageCircle className="w-4 h-4" /> },
    { id: 'contacts', label: 'Contacts', icon: <User className="w-4 h-4" /> },
    { id: 'groups', label: 'Groups', icon: <Users className="w-4 h-4" /> },
  ];

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

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced global search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim().length >= 2) {
      setIsSearching(true);
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const response = await axiosInstance.get(`/search?query=${encodeURIComponent(searchQuery)}`);
          setSearchResults(response.data);
          setShowSearchDropdown(true);
        } catch (error) {
          console.error('Search error:', error);
          showToast('Failed to search', 'error');
        } finally {
          setIsSearching(false);
        }
      }, 300);
    } else {
      setSearchResults(null);
      setShowSearchDropdown(false);
      setIsSearching(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const handleTabChange = (tab: Tab) => {
  setActiveTab(tab);
  // Close chat window when switching to any tab except the current chat's type
  if ((activeTab === 'groups' && tab !== 'groups') || 
      (activeTab === 'chats' && tab !== 'chats')) {
    setSelectedUser(null);
  }
};

  const sortByLastMessage = (items: any[], type: 'chats' | 'contacts' | 'groups') => {
    const { starredChats } = useStarringStore.getState();
    
    return items.sort((a, b) => {
      const aIsStarred = starredChats.includes(a._id);
      const bIsStarred = starredChats.includes(b._id);
      
      if (aIsStarred && !bIsStarred) return -1;
      if (!aIsStarred && bIsStarred) return 1;
      
      if (type === 'chats' || type === 'groups') {
        const aTime = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
        const bTime = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
        return bTime - aTime;
      }
      
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
        showToast("Profile picture updated successfully", "success");
      } catch (error) {
        showToast("Failed to update profile picture.", "error")
      }
    };
  };

  const getprofilePic = () => selectedImg || authUser?.profilePic;

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const handleOpenCreateGroupModal = () => {
    setIsCreateGroupModalOpen(true)
  }

  const handleOpenSettingsModal = () => {
    setIsSettingsModalOpen(true)
  }

  const performLogout = () => {
   logout();
   setShowLogoutModal(false);
  };

  const handleUserClick = async (user: any) => {
    try {
      // If user object is incomplete, fetch full details
      if (!user.fullName || !user.email) {
        const response = await axiosInstance.get(`/users/${user._id}`);
        const fullUser = response.data;
        setSelectedUser({ ...fullUser, chatPartnerId: fullUser._id });
      } else {
        setSelectedUser({ ...user, chatPartnerId: user._id });
      }
      setActiveTab('chats');
      setSearchQuery('');
      setShowSearchDropdown(false);
    } catch (error) {
      console.error('Error fetching user details:', error);
      // Fallback: use whatever data we have
      setSelectedUser({ ...user, chatPartnerId: user._id });
      setActiveTab('chats');
      setSearchQuery('');
      setShowSearchDropdown(false);
    }
  };

  const handleGroupClick = async (group: any) => {
    try {
      // If group object is incomplete, fetch full details
      if (!group.members || group.members.length === 0) {
        const response = await axiosInstance.get(`/groups/${group._id}`);
        const fullGroup = response.data;
        setSelectedUser({ ...fullGroup, groupId: fullGroup._id, isGroup: true });
      } else {
        setSelectedUser({ ...group, groupId: group._id, isGroup: true });
      }
      setActiveTab('groups');
      setSearchQuery('');
      setShowSearchDropdown(false);
    } catch (error) {
      console.error('Error fetching group details:', error);
      // Fallback: use whatever data we have
      setSelectedUser({ ...group, groupId: group._id, isGroup: true });
      setActiveTab('groups');
      setSearchQuery('');
      setShowSearchDropdown(false);
    }
  };

  const handleMessageClick = (message: any) => {
  const { setScrollToMessageId } = useUIStore.getState();
  
  if (message.groupId) {
    handleGroupClick(message.groupId);
    // Set the message ID to scroll to after opening chat
    setScrollToMessageId(message._id);
  } else {
    let otherUser;
    
    if (message.senderId?._id === authUser?._id) {
      otherUser = message.receiverId?._id ? message.receiverId : { _id: message.receiverId };
    } else {
      otherUser = message.senderId;
    }
    
    if (otherUser && (otherUser._id || otherUser)) {
      handleUserClick(typeof otherUser === 'string' ? { _id: otherUser } : otherUser);
      // Set the message ID to scroll to after opening chat
      setScrollToMessageId(message._id);
    } else {
      showToast('Unable to open chat', 'error');
    }
  }
};

  const isLoading = isContactsLoading || isChatsLoading || isGroupsLoading;

  const hasSearchResults = searchResults && (
    searchResults.users.length > 0 || 
    searchResults.groups.length > 0 || 
    searchResults.messages.length > 0
  );

  return (
    <div className="bg-[#121212] md:w-96 text-[#ffffff] h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <SidebarHeader
        authUser={authUser}
        isUpdating={isUpdating}
        fileInputRef={fileInputRef}
        getprofilePic={getprofilePic}
        onImageChange={handleImageUpload}
        onOpenSettings={handleOpenSettingsModal}
        onLogout={handleLogout}
        onCreateGroup={handleOpenCreateGroupModal}
      />

      {/* Search */}
      <SearchBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isSearching={isSearching}
        showSearchDropdown={showSearchDropdown}
        setShowSearchDropdown={setShowSearchDropdown}
        searchDropdownRef={searchDropdownRef}
        searchResults={searchResults}
        handleUserClick={handleUserClick}
        handleGroupClick={handleGroupClick}
        handleMessageClick={handleMessageClick}
      />

      {/* Tabs */}
      <SidebarTabs tabs={tabs} activeTab={activeTab} onChange={handleTabChange} />

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

      <ConfirmModal
        isOpen={showLogoutModal}
        title="Log out?"
        message="You will be signed out of your account. Any unsaved changes may be lost."
        confirmText="Log out"
        cancelText="Stay logged in"
        variant="danger"
        onConfirm={performLogout}
        onClose={() => setShowLogoutModal(false)}
      />

      <CreateGroupModal 
        isOpen={isCreateGroupModalOpen}
        onClose={() => setIsCreateGroupModalOpen(false)}
      />

      <SettingsModal 
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
    </div>
  );
};

export default ChatSidebar;