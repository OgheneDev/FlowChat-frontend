"use client"

import React from "react"
import { SkeletonLoader } from "./SidebarSkeletonLoader"
import ChatItem from "./ChatItem"

type Tab = "chats" | "contacts" | "groups"

interface TabContentProps {
  isLoading: boolean
  activeTab: Tab
  filteredChats: any[]
  filteredContacts: any[]
  filteredGroups: any[]
}

export const TabContent: React.FC<TabContentProps> = ({
  isLoading,
  activeTab,
  filteredChats,
  filteredContacts,
  filteredGroups,
}: TabContentProps) => {
  if (isLoading) {
    return (
      <div className="space-y-0">
        {[...Array(5)].map((_, i) => (
          <SkeletonLoader key={i} />
        ))}
      </div>
    )
  }

  switch (activeTab) {
    case "chats":
      return filteredChats?.length > 0 ? (
        <div>
          {filteredChats.map((chat: any) => (
            <ChatItem key={chat._id} item={chat} type="user" />
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center h-40 text-[#999999]">
          <p className="text-sm">No chats found</p>
        </div>
      )

    case "contacts":
      return filteredContacts?.length > 0 ? (
        <div>
          {filteredContacts.map((contact: any) => (
            <ChatItem key={contact._id} item={contact} type="contact" />
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center h-40 text-[#999999]">
          <p className="text-sm">No contacts found</p>
        </div>
      )

    case "groups":
      return filteredGroups?.length > 0 ? (
        <div>
          {filteredGroups.map((group: any) => (
            <ChatItem key={group._id} item={group} type="group" />
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center h-40 text-[#999999]">
          <p className="text-sm">No groups found</p>
        </div>
      )

    default:
      return null
  }
}