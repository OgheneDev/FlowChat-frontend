import React from 'react'

type TabId = 'chats' | 'contacts' | 'groups'

interface TabDef { id: TabId; label: string; icon: React.ReactNode }

interface Props {
  tabs: TabDef[]
  activeTab: TabId
  onChange: (tab: TabId) => void
}

const SidebarTabs: React.FC<Props> = ({ tabs, activeTab, onChange }) => {
  return (
    <nav className="flex border-b border-[#2a2a2a] bg-[#121212]">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex-1 cursor-pointer flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-all duration-200 relative ${
            activeTab === tab.id ? 'text-[#00d9ff]' : 'text-[#999999] hover:text-white'
          }`}
          aria-current={activeTab === tab.id ? 'page' : undefined}
        >
          {tab.icon}
          <span>{tab.label}</span>
          {activeTab === tab.id && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00d9ff]" />}
        </button>
      ))}
    </nav>
  )
}

export default SidebarTabs
