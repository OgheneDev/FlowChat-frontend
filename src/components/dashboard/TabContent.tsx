"use client";

import React, { useEffect } from "react";
import { SkeletonLoader } from "./SidebarSkeletonLoader";
import ChatItem from "./ChatItem";
import { MessageCircle, Users, User, Plus } from "lucide-react";
import { Tab } from "@/stores";
import { useStarringStore } from "@/stores";

interface TabContentProps {
  isLoading: boolean;
  activeTab: Tab;
  filteredChats: any[];
  filteredContacts: any[];
  filteredGroups: any[];
}

const EmptyState = ({ title, description, icon: Icon, activeTab }: { title: string; description: string; icon: React.ReactNode; activeTab: Tab }) => {
  return (
    <div className="relative flex flex-col items-center justify-center h-64 text-center px-6">
      <div className="p-4 bg-[#1e1e1e] rounded-full mb-4">
        {Icon}
      </div>
      <h3 className="text-lg font-medium text-white mb-1">{title}</h3>
      <p className="text-sm text-[#999999]">{description}</p>
      
      {/* Conditional rendering for buttons based on activeTab */}
      {activeTab === "chats" && (
        <button
          className="absolute bottom-[-50] cursor-pointer left-4 bg-[#00d9ff] text-black p-3 rounded-full shadow-lg hover:bg-[#00c4e6] transition-colors"
          aria-label="Start a new chat"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}
      {activeTab === "groups" && (
        <button
          className="mt-4 bg-[#00d9ff] text-black cursor-pointer px-4 py-2 rounded-full shadow-md hover:bg-[#00c4e6] transition-colors text-sm font-medium"
          aria-label="Create a new group"
        >
          Create group
        </button>
      )}
      {/* No button for contacts as per request */}
    </div>
  );
};

export const TabContent: React.FC<TabContentProps> = ({
  isLoading,
  activeTab,
  filteredChats,
  filteredContacts,
  filteredGroups,
}) => {
  const { loadStarredData, isLoading: isStarredLoading } = useStarringStore();

  // Load starred data when component mounts
  useEffect(() => {
    loadStarredData();
  }, [loadStarredData]);

  // Show loading state if either chats are loading OR starred data is loading
  if (isLoading || isStarredLoading) {
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
    return <EmptyState {...config} activeTab={activeTab} />;
  }

  return (
    <div className="divide-y divide-[#2a2a2a]">
      {data.map((item: any) => (
        <ChatItem key={item._id} item={item} type={activeTab === "groups" ? "group" : activeTab === "contacts" ? "contact" : "user"} />
      ))}
    </div>
  );
};