"use client";

import React from "react";
import { SkeletonLoader } from "./SidebarSkeletonLoader";
import ChatItem from "./ChatItem";
import { MessageCircle, Users, User } from "lucide-react";

type Tab = "chats" | "contacts" | "groups";

interface TabContentProps {
  isLoading: boolean;
  activeTab: Tab;
  filteredChats: any[];
  filteredContacts: any[];
  filteredGroups: any[];
}

const EmptyState = ({ title, description, icon: Icon }: { title: string; description: string; icon: React.ReactNode }) => (
  <div>
    <div className="flex flex-col items-center justify-center h-64 text-center px-6">
    <div className="p-4 bg-[#1e1e1e] rounded-full mb-4">
      {Icon}
    </div>
    <h3 className="text-lg font-medium text-white mb-1">{title}</h3>
    <p className="text-sm text-[#999999]">{description}</p>
  </div> <div className="mt-4">
    <button className="text-sm text-[#00d9ff] hover:underline">
      {title === "No chats" ? "Start a conversation" : title === "No contacts" ? "Add contact" : "Create group"}
    </button>
  </div>
  </div>
);

export const TabContent: React.FC<TabContentProps> = ({
  isLoading,
  activeTab,
  filteredChats,
  filteredContacts,
  filteredGroups,
}) => {
  if (isLoading) {
    return (
      <div className="p-2 space-y-1">
        {[...Array(6)].map((_, i) => (
          <SkeletonLoader key={i} />
        ))}
      </div>
    );
  }

  const data = {
    chats: filteredChats,
    contacts: filteredContacts,
    groups: filteredGroups,
  }[activeTab];

  if (!data || data.length === 0) {
    const emptyConfig = {
      chats: {
        title: "No chats yet",
        description: "Start messaging to see your conversations here.",
        icon: <MessageCircle className="w-8 h-8 text-[#999999]" />,
      },
      contacts: {
        title: "No contacts",
        description: "Add people to start chatting.",
        icon: <User className="w-8 h-8 text-[#999999]" />,
      },
      groups: {
        title: "No groups",
        description: "Create or join a group to collaborate.",
        icon: <Users className="w-8 h-8 text-[#999999]" />,
      },
    };

    const config = emptyConfig[activeTab];
    return <EmptyState {...config} />;
  }

  return (
    <div className="divide-y divide-[#2a2a2a]">
      {data.map((item: any) => (
        <ChatItem key={item._id} item={item} type={activeTab === "groups" ? "group" : activeTab === "contacts" ? "contact" : "user"} />
      ))}
    </div>
  );
};