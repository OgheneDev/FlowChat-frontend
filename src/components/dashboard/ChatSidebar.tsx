"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useUIStore, useContactStore, useGroupStore, usePrivateChatStore, useStarringStore, useAuthStore } from '@/stores';
import { Tab } from '@/stores';
import { Bell, Settings, LogOut, Search, X, User, Camera, Users, MessageCircle, SquarePen, Hash } from 'lucide-react';
import { TabContent } from './sidebar/TabContent';
import { useToastStore } from '@/stores';
import ConfirmModal from './sidebar/ConfirmModal';
import CreateGroupModal from '../modals/CreateGroupModal';
import SettingsModal from '../modals/SettingsModal';
import { axiosInstance } from '@/api/axios'; 

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
    if (tab !== 'chats') {
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
    if (message.groupId) {
      // For group messages
      handleGroupClick(message.groupId);
    } else {
      // For private messages - determine the other user
      let otherUser;
      
      if (message.senderId?._id === authUser?._id) {
        // I sent this message, so open chat with receiver
        otherUser = message.receiverId?._id ? message.receiverId : { _id: message.receiverId };
      } else {
        // Someone sent me this message, so open chat with sender
        otherUser = message.senderId;
      }
      
      if (otherUser && (otherUser._id || otherUser)) {
        handleUserClick(typeof otherUser === 'string' ? { _id: otherUser } : otherUser);
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
            ) : getprofilePic() ? (
              <img src={getprofilePic()!} alt="Profile" className="size-full object-cover" />
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
            { Icon: Settings, label: "Settings", onClick: handleOpenSettingsModal },
            { Icon: LogOut, label: "Logout", onClick: handleLogout },
            { Icon: SquarePen, label: "Create Group", onClick: handleOpenCreateGroupModal}
          ].map(({ Icon, label, onClick }) => (
            <button
              key={label}
              onClick={onClick}
              aria-label={label}
              title={label}
              className="p-2 rounded-lg cursor-pointer hover:bg-[#1e1e1e] transition-all duration-200 group"
            >
              <Icon className="w-5 h-5 text-[#999999] group-hover:text-white transition-colors" />
            </button>
          ))}
        </div>
      </header>

      {/* Search */}
      <div className="p-4 border-b border-[#2a2a2a] bg-[#121212] sticky top-0 z-20" ref={searchDropdownRef}>
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999999] pointer-events-none" />
          <input
            type="text"
            placeholder="Search users, groups, messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl text-sm text-white placeholder-[#999999] focus:outline-none focus:border-[#00d9ff] focus:ring-2 focus:ring-[#00d9ff]/20 transition-all duration-200"
          />
          {(searchQuery || isSearching) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setShowSearchDropdown(false);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-[#2a2a2a] transition-colors"
              aria-label="Clear search"
            >
              {isSearching ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#00d9ff] border-t-transparent"></div>
              ) : (
                <X className="w-4 h-4 text-[#999999]" />
              )}
            </button>
          )}
        </div>

        {/* Search Dropdown */}
        {showSearchDropdown && searchQuery.trim().length >= 2 && (
          <div className="absolute left-4 right-4 mt-2 bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl shadow-2xl max-h-96 overflow-y-auto z-30">
            {!hasSearchResults && !isSearching && (
              <div className="p-4 text-center text-[#999999] text-sm">
                No results found for "{searchQuery}"
              </div>
            )}

            {/* Users */}
            {searchResults?.users && searchResults.users.length > 0 && (
              <div className="border-b border-[#2a2a2a]">
                <div className="px-4 py-2 text-xs font-semibold text-[#999999] uppercase tracking-wider">
                  Users
                </div>
                {searchResults.users.map((user) => (
                  <button
                    key={user._id}
                    onClick={() => handleUserClick(user)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#2a2a2a] transition-colors cursor-pointer"
                  >
                    <div className="size-10 rounded-full overflow-hidden bg-[#121212] flex-shrink-0">
                      {user.profilePic ? (
                        <img src={user.profilePic} alt={user.fullName} className="size-full object-cover" />
                      ) : (
                        <div className="size-full flex items-center justify-center">
                          <User className="w-5 h-5 text-[#999999]" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-sm font-medium text-white">{user.fullName}</div>
                      <div className="text-xs text-[#999999]">{user.email}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Groups */}
            {searchResults?.groups && searchResults.groups.length > 0 && (
              <div className="border-b border-[#2a2a2a]">
                <div className="px-4 py-2 text-xs font-semibold text-[#999999] uppercase tracking-wider">
                  Groups
                </div>
                {searchResults.groups.map((group) => (
                  <button
                    key={group._id}
                    onClick={() => handleGroupClick(group)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#2a2a2a] transition-colors cursor-pointer"
                  >
                    <div className="size-10 rounded-full overflow-hidden bg-[#121212] flex-shrink-0">
                      {group.groupImage ? (
                        <img src={group.groupImage} alt={group.name} className="size-full object-cover" />
                      ) : (
                        <div className="size-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-[#999999]" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-sm font-medium text-white">{group.name}</div>
                      <div className="text-xs text-[#999999]">{group.members?.length || 0} members</div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Messages */}
            {searchResults?.messages && searchResults.messages.length > 0 && (
              <div>
                <div className="px-4 py-2 text-xs font-semibold text-[#999999] uppercase tracking-wider">
                  Messages
                </div>
                {searchResults.messages.map((message) => (
                  <button
                    key={message._id}
                    onClick={() => handleMessageClick(message)}
                    className="w-full flex items-start gap-3 px-4 py-3 hover:bg-[#2a2a2a] transition-colors cursor-pointer"
                  >
                    <div className="size-10 rounded-full overflow-hidden bg-[#121212] flex-shrink-0">
                      {message.groupId ? (
                        message.groupId.groupImage ? (
                          <img src={message.groupId.groupImage} alt={message.groupId.name} className="size-full object-cover" />
                        ) : (
                          <div className="size-full flex items-center justify-center">
                            <Hash className="w-5 h-5 text-[#999999]" />
                          </div>
                        )
                      ) : message.senderId?.profilePic ? (
                        <img src={message.senderId.profilePic} alt={message.senderId.fullName} className="size-full object-cover" />
                      ) : (
                        <div className="size-full flex items-center justify-center">
                          <User className="w-5 h-5 text-[#999999]" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="text-sm font-medium text-white truncate">
                        {message.groupId ? message.groupId.name : message.senderId?.fullName}
                      </div>
                      <div className="text-xs text-[#999999] truncate">{message.text || message.content}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
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