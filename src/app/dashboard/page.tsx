"use client"

import React, { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import ChatSidebar from '@/components/dashboard/ChatSidebar'
import ChatWindow from '@/components/dashboard/ChatWindow'
import { useUIStore } from '@/stores'

const DashboardPage = () => {
  const { selectedUser, activeTab, setSelectedUser, setActiveTab } = useUIStore()
  const searchParams = useSearchParams()
  
  // Handle query params on page load (for new window opens from notifications)
  useEffect(() => {
    const chatId = searchParams.get('chat')
    const chatType = searchParams.get('type')

    if (chatId && chatType) {
      console.log('📱 Opening chat from URL params:', { chatId, chatType })
      
      // Set the appropriate tab
      if (chatType === 'group') {
        setActiveTab('groups')
      } else {
        setActiveTab('chats')
      }
      
      // Open the chat
      setSelectedUser(chatId)
      
      // Clean up URL params after handling
      window.history.replaceState({}, '', '/dashboard')
    }
  }, [searchParams, setSelectedUser, setActiveTab])

  // Handle postMessage from service worker (for existing windows)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      console.log('📬 Received message from service worker:', event.data)
      
      if (event.data.type === 'OPEN_CHAT') {
        const { chatId, chatType } = event.data
        
        console.log('📱 Opening chat from service worker message:', { chatId, chatType })
        
        // Set the appropriate tab
        if (chatType === 'group') {
          setActiveTab('groups')
        } else {
          setActiveTab('chats')
        }
        
        // Open the chat
        setSelectedUser(chatId)
      }
    }

    navigator.serviceWorker?.addEventListener('message', handleMessage)

    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleMessage)
    }
  }, [setSelectedUser, setActiveTab])
  
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