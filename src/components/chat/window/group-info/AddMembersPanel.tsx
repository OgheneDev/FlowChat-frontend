import React from 'react'
import { Check } from 'lucide-react'
import Image from 'next/image'

interface Props {
  contacts: any[]
  contactsLoading: boolean
  searchQuery: string
  setSearchQuery: (s: string) => void
  filteredAvailableContacts: any[]
  selectedContacts: string[]
  toggleContactSelection: (id: string) => void
  onAddMembers: () => void
  isAddingMembers: boolean
}

const AddMembersPanel: React.FC<Props> = ({ contacts, contactsLoading, searchQuery, setSearchQuery, filteredAvailableContacts, selectedContacts, toggleContactSelection, onAddMembers, isAddingMembers }) => {
  return (
    <div className="p-4">
      <div className="mb-4">
        <div className="relative">
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search contacts" className="w-full pl-3 pr-4 py-2 bg-[#1e1e1e] rounded-lg text-sm text-white placeholder-[#666] focus:outline-none focus:ring-2 focus:ring-[#00d9ff]" />
        </div>
      </div>

      <div className="space-y-2">
        {contactsLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00d9ff] mx-auto"></div>
            <p className="text-[#999] mt-2">Loading contacts...</p>
          </div>
        ) : filteredAvailableContacts.length === 0 ? (
          <div className="text-center py-8 text-[#999]">{searchQuery ? 'No contacts found' : 'No contacts available to add'}</div>
        ) : (
          filteredAvailableContacts.map((contact) => {
            const contactId = contact._id || contact.userId?._id
            const name = contact.fullName || contact.userId?.fullName || 'Unknown'
            const pic = contact.profilePic || contact.userId?.profilePic

            return (
              <div key={contactId} onClick={() => toggleContactSelection(contactId)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#1e1e1e] transition-colors cursor-pointer">
                <div className="w-11 h-11 rounded-full overflow-hidden bg-[#2a2a2a] relative">
                  {pic ? <Image src={pic} alt={name} fill sizes="44px" className="object-cover" /> : <div className="w-full h-full flex items-center justify-center text-sm font-bold text-[#00d9ff]">{name.charAt(0).toUpperCase()}</div>}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{name}</p>
                </div>

                <div className={`w-6 h-6 rounded-full border-2 transition-colors ${selectedContacts.includes(contactId) ? 'bg-[#00d9ff] border-[#00d9ff]' : 'border-[#666]'}`}>
                  {selectedContacts.includes(contactId) && <Check className="w-4 h-4 text-white" />}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default AddMembersPanel
