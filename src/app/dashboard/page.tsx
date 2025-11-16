"use client"

import React, { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import ChatSidebar from '@/components/dashboard/ChatSidebar'
import ChatWindow from '@/components/dashboard/ChatWindow'
import { useUIStore, useGroupStore, usePrivateChatStore } from '@/stores'
import { axiosInstance } from '@/api/axios'

const DashboardPage = () => {
  const { selectedUser, activeTab, setSelectedUser, setActiveTab } = useUIStore()
  const { groups } = useGroupStore()
  const { chats } = usePrivateChatStore()
  const searchParams = useSearchParams()
  
  // Helper function to fetch and set user/group details
  const openChatById = async (chatId: string, chatType: 'user' | 'group') => {
    try {
      console.log('Opening chat:', { chatId, chatType })
      
      if (chatType === 'group') {
        setActiveTab('groups')
        
        // First check if we already have this group in memory
        const existingGroup = groups.find(g => g._id === chatId)
        if (existingGroup) {
          console.log('Using cached group data')
          setSelectedUser(existingGroup)
          return
        }
        
        // Otherwise fetch it
        console.log('Fetching group details...')
        const { data } = await axiosInstance.get(`/groups/${chatId}`)
        setSelectedUser(data)
      } else {
        setActiveTab('chats')
        
        // First check if we already have this chat in memory
        const existingChat = chats.find(c => {
          const partnerId = c.participants?.find(p => p !== chatId) || c._id
          return partnerId === chatId || c._id === chatId
        })
        
        if (existingChat) {
          console.log('Using cached user data')
          setSelectedUser(existingChat)
          return
        }
        
        // Otherwise fetch the user
        console.log('Fetching user details...')
        const { data } = await axiosInstance.get(`/users/${chatId}`)
        setSelectedUser({ ...data, chatPartnerId: data._id })
      }
    } catch (error) {
      console.error('Error opening chat:', error)
    }
  }
  
  // Handle query params on page load (for new window opens from notifications)
  useEffect(() => {
    const chatId = searchParams.get('chat')
    const chatType = searchParams.get('type') as 'user' | 'group' | null

    if (chatId && chatType) {
      console.log('Opening chat from URL params:', { chatId, chatType })
      openChatById(chatId, chatType)
      
      // Clean up URL params after handling
      window.history.replaceState({}, '', '/dashboard')
    }
  }, [searchParams])

  // Handle postMessage from service worker (for existing windows)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      console.log('📬 Received message from service worker:', event.data)
      
      if (event.data.type === 'OPEN_CHAT') {
        const { chatId, chatType } = event.data
        
        console.log('📱 Opening chat from service worker message:', { chatId, chatType })
        openChatById(chatId, chatType)
      }
    }

    navigator.serviceWorker?.addEventListener('message', handleMessage)

    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleMessage)
    }
  }, [groups, chats])
  
  return (
    <div className="h-screen">
      {/* Mobile: Sidebar full screen when no chat selected, hidden when chat selected */}
      <div className="md:hidden">
        {selectedUser ? (
          <ChatWindow 
            selectedUser={selectedUser} 
            type={activeTab === 'groups' ? 'group' : 'user'} 
          />
        ) : (
          <ChatSidebar />
        )}
      </div>
      
      {/* Desktop: Side by side layout */}
      <div className="hidden md:flex h-full">
        <ChatSidebar />
        <ChatWindow 
          selectedUser={selectedUser} 
          type={activeTab === 'groups' ? 'group' : 'user'} 
        />
      </div>
    </div>
  )
}

export default DashboardPage