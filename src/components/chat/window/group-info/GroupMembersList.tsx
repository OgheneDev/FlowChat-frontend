import React from 'react'
import { Loader2, Crown, UserMinus, UserPlus, Users } from 'lucide-react'
import Image from 'next/image'

interface Props {
  activeTab: string
  members: any[]
  admins: any[] // Add admins array to props
  authUserId?: string | null
  isAdmin: boolean
  isRemovingMember?: string | null
  isMakingAdmin?: string | null
  handleRemoveMember: (id: string, name: string) => void
  handleMakeAdmin: (id: string, name: string) => void
  isAddingMembers?: boolean
  onShowAddMembers?: () => void
}

const GroupMembersList: React.FC<Props> = ({ 
  activeTab, 
  members, 
  admins, // Destructure admins
  authUserId, 
  isAdmin, 
  isRemovingMember, 
  isMakingAdmin, 
  handleRemoveMember, 
  handleMakeAdmin,
  onShowAddMembers 
}) => {
  if (activeTab !== 'members') return null

  // Helper function to check if a member is an admin
  const checkIsMemberAdmin = (memberId: string): boolean => {
    return admins.some(admin => admin._id === memberId)
  }

  return (
    <div>
      <div className="space-y-1 mt-4 max-h-96 overflow-y-auto">
        {members.length === 0 ? (
          <div className="text-center py-8 text-[#999]">
            No members in this group
          </div>
        ) : (
          members.map((member: any) => {
            const id = member._id
            const name = member.fullName || 'Unknown'
            const pic = member.profilePic
            const isMemberAdmin = checkIsMemberAdmin(id) // Use the helper function
            const isSelf = id === authUserId
            const removing = isRemovingMember === id
            const making = isMakingAdmin === id

            return (
              <div key={id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#1e1e1e] transition-colors group">
                <div className="relative flex-shrink-0">
                  <div className="w-11 h-11 rounded-full overflow-hidden bg-[#2a2a2a] relative">
                    {pic ? (
                      <Image 
                        src={pic} 
                        alt={name} 
                        fill 
                        sizes="44px" 
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-sm font-bold text-[#00d9ff]">
                        {name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  {isMemberAdmin && (
                    <Crown className="absolute -top-1 -right-1 w-4 h-4 text-yellow-500" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">
                    {name} {isSelf && (
                      <span className="text-[#999] text-xs">(You)</span>
                    )}
                  </p>
                  <p className="text-xs text-[#999]">
                    {isMemberAdmin ? 'Admin' : 'Member'}
                  </p>
                </div>

                {isAdmin && !isSelf && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!isMemberAdmin && (
                      <button 
                        onClick={() => handleMakeAdmin(id, name)} 
                        disabled={making || removing} 
                        className="p-1.5 bg-[#2a2a2a] rounded cursor-pointer hover:bg-[#3a3a3a] disabled:opacity-50"
                        title="Make Admin"
                      >
                        {making ? (
                          <Loader2 className="animate-spin h-3.5 w-3.5"/>
                        ) : (
                          <UserPlus className="w-3.5 h-3.5 text-[#00d9ff]"/>
                        )}
                      </button>
                    )}
                    <button 
                      onClick={() => handleRemoveMember(id, name)} 
                      disabled={removing || making} 
                      className="p-1.5 bg-red-500/20 rounded cursor-pointer hover:bg-red-500/30 disabled:opacity-50"
                      title="Remove Member"
                    >
                      {removing ? (
                        <Loader2 className="animate-spin h-3.5 w-3.5 text-red-500"/>
                      ) : (
                        <UserMinus className="w-3.5 h-3.5 text-red-500"/>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
      {/* Add Members Button - Only show for admins */}
      {isAdmin && onShowAddMembers && (
        <div className="mt-4">
          <button
            onClick={onShowAddMembers}
            className="w-full py-3 text-sm cursor-pointer bg-[#00d9ff]/10 text-[#00d9ff] rounded-lg font-medium hover:bg-[#00d9ff]/20 transition-colors flex items-center justify-center gap-2"
          >
            <Users className="w-4 h-4" />
            Add Members
          </button>
        </div>
      )}
    </div>
  )
}

export default GroupMembersList