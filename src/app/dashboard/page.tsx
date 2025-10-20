"use client"

import React from 'react'
import ChatSidebar from '@/components/dashboard/ChatSidebar'
import ChatWindow from '@/components/dashboard/ChatWindow'
import { useChatStore } from '@/stores/useChatStore'

const DashboardPage = () => {
  const { selectedUser, activeTab } = useChatStore() as any
  
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