"use client"

import React, { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import ChatSidebar from '@/components/dashboard/ChatSidebar'
import ChatWindow from '@/components/dashboard/ChatWindow'
import { useUIStore } from '@/stores'
import { usePrivateChatStore, useGroupStore, useAuthStore } from '@/stores'

const DashboardPage = () => {
  const { selectedUser, activeTab, setSelectedUser, setActiveTab } = useUIStore()
  const { chats, getChatPartners } = usePrivateChatStore()
  const { groups, getMyGroups } = useGroupStore()
  const { authUser } = useAuthStore()
  const searchParams = useSearchParams()
  
  // Helper function to find and set user/group object
  const findAndSelectChat = async (chatId: string, chatType: string) => {
    console.log('📱 Finding chat:', { chatId, chatType })
    
    if (chatType === 'group') {
      setActiveTab('groups')
      
      // Try to find in existing groups
      let group = groups.find(g => g._id === chatId)
      
      if (!group) {
        console.log('Group not in store, fetching groups...')
        await getMyGroups()
        group = useGroupStore.getState().groups.find(g => g._id === chatId)
      }
      
      if (group) {
        console.log('✅ Found group:', group)
        setSelectedUser(group._id)
      } else {
        console.warn('❌ Group not found:', chatId)
      }
    } else {
      setActiveTab('chats')
      
      // Try to find in existing chats
      let chat = chats.find(c => {
        const partnerId = c.participants?.find(p => p !== authUser?._id)
        return partnerId === chatId || c._id === chatId
      })
      
      if (!chat) {
        console.log('Chat not in store, fetching chats...')
        await getChatPartners()
        chat = usePrivateChatStore.getState().chats.find(c => {
          const partnerId = c.participants?.find(p => p !== authUser?._id)
          return partnerId === chatId || c._id === chatId
        })
      }
      
      if (chat) {
        // Get the partner ID (the other user in the conversation)
        const partnerId = chat.participants?.find(p => p !== authUser?._id) || chatId
        console.log('✅ Found chat, setting partner:', partnerId)
        setSelectedUser(partnerId)
      } else {
        console.warn('❌ Chat not found:', chatId)
      }
    }
  }
  
  // Handle query params on page load (for new window opens from notifications)
  useEffect(() => {
    const chatId = searchParams.get('chat')
    const chatType = searchParams.get('type')

    if (chatId && chatType && authUser) {
      console.log('📱 Opening chat from URL params:', { chatId, chatType })
      findAndSelectChat(chatId, chatType)
      
      // Clean up URL params after handling
      window.history.replaceState({}, '', '/dashboard')
    }
  }, [searchParams, authUser])

  // Handle postMessage from service worker (for existing windows)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      console.log('📬 Received message from service worker:', event.data)
      
      if (event.data.type === 'OPEN_CHAT' && authUser) {
        const { chatId, chatType } = event.data
        console.log('📱 Opening chat from service worker message:', { chatId, chatType })
        findAndSelectChat(chatId, chatType)
      }
    }

    navigator.serviceWorker?.addEventListener('message', handleMessage)

    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleMessage)
    }
  }, [authUser, chats, groups])

  // Get the actual selected user/group object for ChatWindow
  const getSelectedUserObject = () => {
    if (!selectedUser) return null
    
    if (activeTab === 'groups') {
      return groups.find(g => g._id === selectedUser) || null
    } else {
      // For private chats, find the chat and return it
      const chat = chats.find(c => {
        const partnerId = c.participants?.find(p => p !== authUser?._id)
        return partnerId === selectedUser || c._id === selectedUser
      })
      return chat || null
    }
  }

  const selectedUserObject = getSelectedUserObject()
  
  return (
    <div className="h-screen">
      {/* Mobile: Sidebar full screen when no chat selected, hidden when chat selected */}
      <div className="md:hidden">
        {selectedUser ? (
          <ChatWindow 
            selectedUser={selectedUserObject} 
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
          selectedUser={selectedUserObject} 
          type={activeTab === 'groups' ? 'group' : 'user'} 
        />
      </div>
    </div>
  )
}

export default DashboardPage