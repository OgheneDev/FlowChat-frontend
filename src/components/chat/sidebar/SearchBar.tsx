import React from 'react'
import { Search, X, User, Users, Hash } from 'lucide-react'
import Image from 'next/image'

interface SearchResults {
  users: any[]
  groups: any[]
  messages: any[]
}

interface Props {
  searchQuery: string
  setSearchQuery: (v: string) => void
  isSearching: boolean
  showSearchDropdown: boolean
  setShowSearchDropdown: (v: boolean) => void
  searchDropdownRef: React.RefObject<HTMLDivElement | null>
  searchResults: SearchResults | null
  handleUserClick: (user: any) => void
  handleGroupClick: (group: any) => void
  handleMessageClick: (message: any) => void
}

const SearchBar: React.FC<Props> = ({
  searchQuery,
  setSearchQuery,
  isSearching,
  showSearchDropdown,
  setShowSearchDropdown,
  searchDropdownRef,
  searchResults,
  handleUserClick,
  handleGroupClick,
  handleMessageClick,
}) => {
  const hasSearchResults = !!searchResults && (searchResults.users.length > 0 || searchResults.groups.length > 0 || searchResults.messages.length > 0)

  return (
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
            onClick={() => { setSearchQuery(''); setShowSearchDropdown(false); }}
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

      {showSearchDropdown && searchQuery.trim().length >= 2 && (
        <div className="absolute left-4 right-4 mt-2 bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl shadow-2xl max-h-96 overflow-y-auto z-30">
          {!hasSearchResults && !isSearching && (
            <div className="p-4 text-center text-[#999999] text-sm">
              No results found for "{searchQuery}"
            </div>
          )}

          {searchResults?.users && searchResults.users.length > 0 && (
            <div className="border-b border-[#2a2a2a]">
              <div className="px-4 py-2 text-xs font-semibold text-[#999999] uppercase tracking-wider">Users</div>
              {searchResults.users.map((user) => (
                <button key={user._id} onClick={() => handleUserClick(user)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#2a2a2a] transition-colors cursor-pointer">
                  <div className="size-10 rounded-full overflow-hidden bg-[#121212] flex-shrink-0">
                    {user.profilePic ? <Image src={user.profilePic} alt={user.fullName} className="size-full object-cover" /> : <div className="size-full flex items-center justify-center"><User className="w-5 h-5 text-[#999999]" /></div>}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium text-white">{user.fullName}</div>
                    <div className="text-xs text-[#999999]">{user.email}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {searchResults?.groups && searchResults.groups.length > 0 && (
            <div className="border-b border-[#2a2a2a]">
              <div className="px-4 py-2 text-xs font-semibold text-[#999999] uppercase tracking-wider">Groups</div>
              {searchResults.groups.map((group) => (
                <button key={group._id} onClick={() => handleGroupClick(group)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#2a2a2a] transition-colors cursor-pointer">
                  <div className="size-10 rounded-full overflow-hidden bg-[#121212] flex-shrink-0">
                    {group.groupImage ? <Image src={group.groupImage} alt={group.name} className="size-full object-cover" /> : <div className="size-full flex items-center justify-center"><Users className="w-5 h-5 text-[#999999]" /></div>}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium text-white">{group.name}</div>
                    <div className="text-xs text-[#999999]">{group.members?.length || 0} members</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {searchResults?.messages && searchResults.messages.length > 0 && (
            <div>
              <div className="px-4 py-2 text-xs font-semibold text-[#999999] uppercase tracking-wider">Messages</div>
              {searchResults.messages.map((message) => (
                <button key={message._id} onClick={() => handleMessageClick(message)} className="w-full flex items-start gap-3 px-4 py-3 hover:bg-[#2a2a2a] transition-colors cursor-pointer">
                  <div className="size-10 rounded-full overflow-hidden bg-[#121212] flex-shrink-0">
                    {message.groupId ? (message.groupId.groupImage ? <Image src={message.groupId.groupImage} alt={message.groupId.name} className="size-full object-cover" /> : <div className="size-full flex items-center justify-center"><Hash className="w-5 h-5 text-[#999999]" /></div>)
                      : message.senderId?.profilePic ? <Image src={message.senderId.profilePic} alt={message.senderId.fullName} className="size-full object-cover" /> : <div className="size-full flex items-center justify-center"><User className="w-5 h-5 text-[#999999]" /></div>}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="text-sm font-medium text-white truncate">{message.groupId ? message.groupId.name : message.senderId?.fullName}</div>
                    <div className="text-xs text-[#999999] truncate">{message.text || message.content}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default SearchBar
