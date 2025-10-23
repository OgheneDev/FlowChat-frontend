"use client"

import React, { useState, useEffect, useRef } from 'react'
import { useChatStore } from '@/stores/useChatStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { Bell, Settings, LogOut, Search, X, User, Camera } from 'lucide-react'
import { TabContent } from './TabContent'
import { Toast } from '../ui/toast'
import Swal from 'sweetalert2' 

type Tab = "chats" | "contacts" | "groups"

interface AuthUser {
  profilePic?: string
  // Add other properties as needed
}

interface ChatStore {
  setActiveTab: (tab: Tab) => void
  contacts: any[]
  groups: any[]
  chats: any[]
  getAllContacts: () => void
  getChatPartners: () => void
  getMyGroups: () => void
  isLoading: boolean
  selectedUser: any
  setSelectedUser: (user: any) => void
}

interface AuthStore {
  logout: () => void
  authUser?: AuthUser
  updateProfile: (data: { profilePic: string }) => Promise<void>
  isUpdating: boolean
}

const ChatSidebar = () => {
  const [activeTab, setActiveTab] = useState<Tab>("chats")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedImg, setSelectedImg] = useState<string | null>(null)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error'>('success')
  
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
  } = useChatStore() as ChatStore
  
  const { logout, authUser, updateProfile, isUpdating } = useAuthStore() as AuthStore
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const tabs: { id: Tab; label: string }[] = [
    { id: 'chats', label: 'Chats' },
    { id: 'contacts', label: 'Contacts' },
    { id: 'groups', label: 'Groups' },
  ]

  useEffect(() => {
    if (authUser) {
      getAllContacts()
      getChatPartners()
      getMyGroups()
    }
  }, [authUser, getAllContacts, getChatPartners, getMyGroups])

  // Handle toast cleanup
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [showToast])

  const handleTabChange = (tab: Tab) => {
  setActiveTab(tab)
  setStoreActiveTab(tab)

  // If switching away from 'chats' and a user is selected, deselect them
  if (activeTab === 'chats' && selectedUser) {
    setSelectedUser(null)
  }
}

  const filterList = (items: any[], searchFields: string[]) => {
    if (!searchQuery.trim()) return items
    return items.filter((item) =>
      searchFields.some((field) =>
        item[field]?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    )
  }

  const filteredChats = filterList(chats || [], ['fullName'])
  const filteredContacts = filterList(contacts || [], ['fullName'])
  const filteredGroups = filterList(groups || [], ['name'])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.readAsDataURL(file)

    reader.onloadend = async () => {
      const base64Image = reader.result as string
      setSelectedImg(base64Image)
      
      try {
        await updateProfile({ profilePic: base64Image })
        // Success - show toast
        setToastMessage('Profile picture updated successfully!')
        setToastType('success')
        setShowToast(true)
      } catch (error) {
        // Error - revert image and show error toast
        setSelectedImg(authUser?.profilePic || null)
        setToastMessage('Failed to update profile picture. Please try again.')
        setToastType('error')
        setShowToast(true)
      }
    }
  }

  // Get profile image with User icon fallback
  const getProfileImage = () => {
    const imageSrc = selectedImg || authUser?.profilePic
    return imageSrc ? imageSrc : undefined
  }

  const handleLogout = () => {
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to log out?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, log out!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        logout();
      }
    });
  };

  return (
    <div className="bg-[#121212] md:w-[360px] text-[#ffffff] h-screen flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-5 border-b border-[#2a2a2a]">
        {/* AVATAR */}
        <div className="avatar online">
          <button
            className="size-14 rounded-full overflow-hidden cursor-pointer relative group disabled:cursor-not-allowed"
            onClick={() => !isUpdating && fileInputRef.current?.click()}
            disabled={isUpdating}
          >
            {isUpdating ? (
              // Loading state
              <div className="size-full bg-[#1e1e1e] flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#00d9ff]"></div>
              </div>
            ) : getProfileImage() ? (
              <img
                src={getProfileImage()!}
                alt="User image"
                className="size-full object-cover"
              />
            ) : (
              <div className="size-full bg-[#1e1e1e] flex items-center justify-center">
                <User className="w-8 h-8 text-[#999999]" />
              </div>
            )}
            
            {!isUpdating && (
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <span className="text-white text-xs">Change</span>
              </div>
            )}
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
        
        <div className="flex gap-3 items-center">
          <button 
            className="p-1.5 hover:bg-[#1e1e1e] rounded-lg transition-colors cursor-pointer duration-200"
          >
            <Bell className="w-5 h-5 text-[#999999] hover:text-[#ffffff]" />
          </button>
          <button className="p-1.5 hover:bg-[#1e1e1e] rounded-lg transition-colors cursor-pointer duration-200">
            <Settings className="w-5 h-5 text-[#999999] hover:text-[#ffffff]" />
          </button>
          <button 
            className="p-1.5 hover:bg-[#1e1e1e] rounded-lg transition-colors cursor-pointer duration-200"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5 text-[#999999] hover:text-[#ffffff]" />
          </button>
        </div>
      </div>

      {/* Search Container */}
      <div className="p-4 border-b border-[#2a2a2a] sticky top-0 bg-[#121212] z-10">
        <div className="relative">
          <Search className="absolute left-3 top-3.5 w-4 h-4 text-[#999999]" />
          <input
            placeholder="Search chats, contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-3 w-full bg-[#1e1e1e] text-[#ffffff] border border-[#2a2a2a] rounded-lg py-2.5 outline-none placeholder:text-sm placeholder:text-[#999999] transition-colors cursor-pointer focus:border-[#00d9ff]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-3.5 p-0.5 hover:bg-[#2a2a2a] rounded transition-colors cursor-pointer"
            >
              <X className="w-4 h-4 text-[#999999]" />
            </button>
          )}
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex justify-between border-b border-[#2a2a2a] p-3 px-4 bg-[#1e1e1e]/50">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`text-sm cursor-pointer transition-all py-2 px-3 rounded-lg font-medium ${
              activeTab === tab.id
                ? 'bg-[#00d9ff]/10 text-[#00d9ff] shadow-sm border border-[#00d9ff]/20'
                : 'text-[#999999] hover:bg-[#2a2a2a]/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        <TabContent
          isLoading={isLoading}
          activeTab={activeTab}
          filteredChats={filteredChats}
          filteredContacts={filteredContacts}
          filteredGroups={filteredGroups}
        />
      </div>

      {/* Toast Notification */}
      <Toast
        show={showToast}
        message={toastMessage}
        type={toastType}
        onClose={() => setShowToast(false)}
        duration={3000}
      />
    </div>
  )
}

export default ChatSidebar