import React, { useState, useEffect } from "react";
import { X, Search, User, Users, Check, MessageSquare } from "lucide-react";
import { usePrivateChatStore } from "@/stores";
import { useGroupStore } from "@/stores";

interface Contact {
  _id: string;
  fullName: string;
  profilePic?: string;
  type: "contact";
}

interface Group {
  _id: string;
  name: string;
  avatar?: string;
  type: "group";
}

interface ForwardModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: {
    text?: string;
    image?: string;
  };
  messages?: any[]; // Add this for bulk forwarding
  onForward: (selectedIds: string[], messages: any[]) => void;
  isBulk?: boolean; // Add this to distinguish between single and bulk forwarding
}

const ForwardModal = ({ 
  isOpen, 
  onClose, 
  message, 
  messages = [], 
  onForward, 
  isBulk = false 
}: ForwardModalProps) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { getChatPartners } = usePrivateChatStore();
  const { getMyGroups } = useGroupStore();

  useEffect(() => {
    if (isOpen) {
      fetchData();
      setSelectedItems([]);
      setSearchTerm("");
    }
  }, [isOpen]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [contactsData, groupsData] = await Promise.all([
        getChatPartners(),
        getMyGroups()
      ]);

      // Transform contacts data
      const transformedContacts: Contact[] = contactsData.map((chat: any) => ({
        _id: chat._id,
        fullName: chat.fullName || chat.participantDetails?.[0]?.fullName || "Unknown",
        profilePic: chat.profilePic || chat.participantDetails?.[0]?.profilePic,
        type: "contact" as const
      }));

      // Transform groups data
      const transformedGroups: Group[] = groupsData.map((group: any) => ({
        _id: group._id,
        name: group.name,
        avatar: group.avatar,
        type: "group" as const
      }));

      setContacts(transformedContacts);
      setGroups(transformedGroups);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredContacts = contacts.filter(contact =>
    contact.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleSelection = (id: string) => {
    setSelectedItems(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const handleForward = () => {
    if (selectedItems.length === 0) return;
    
    // For bulk forwarding, use the messages array
    // For single message forwarding, create an array with the single message
    const messagesToForward = isBulk ? messages : [message];
    
    onForward(selectedItems, messagesToForward);
    onClose();
    setSelectedItems([]);
    setSearchTerm("");
  };

  // Get message preview for display
  const getMessagePreview = () => {
    if (isBulk && messages.length > 0) {
      if (messages.length === 1) {
        const msg = messages[0];
        return msg.text 
          ? (msg.text.length > 30 ? msg.text.substring(0, 30) + '...' : msg.text)
          : msg.image ? '📷 Photo' : 'Message';
      } else {
        return `${messages.length} messages`;
      }
    } else if (message) {
      return message.text 
        ? (message.text.length > 30 ? message.text.substring(0, 30) + '...' : message.text)
        : message.image ? '📷 Photo' : 'Message';
    }
    return '';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-[#1a1a1a] to-[#1e1e1e] rounded-lg w-full max-w-md max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#3b4a54]">
          <div>
            <h2 className="text-lg font-semibold text-white">
              {isBulk ? 'Forward Messages' : 'Forward Message'}
            </h2>
            <p className="text-sm text-[#8696a0]">Select chats to forward to</p>
            
            {/* Message Preview */}
            {(message || (isBulk && messages.length > 0)) && (
              <div className="mt-2 p-2 bg-[#2a2a2a] rounded-lg border border-[#3b4a54]">
                <div className="flex items-center gap-2 text-xs text-[#8696a0]">
                  <MessageSquare className="w-3 h-3" />
                  <span className="font-medium">Forwarding:</span>
                  <span className="text-white truncate">{getMessagePreview()}</span>
                  {isBulk && messages.length > 1 && (
                    <span className="text-[#00d9ff] font-medium ml-1">
                      ({messages.length})
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#182229] cursor-pointer rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-[#8696a0]" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-[#3b4a54]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#8696a0]" />
            <input
              type="text"
              placeholder="Search contacts and groups..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#2a2a2a] text-white pl-10 pr-4 py-2 rounded-lg border border-[#3b4a54] focus:outline-none focus:border-[#00d9ff]"
            />
          </div>
        </div>

        {/* Selected Count */}
        {selectedItems.length > 0 && (
          <div className="px-4 py-2 bg-[#182229] border-b border-[#3b4a54]">
            <p className="text-sm text-[#00d9ff]">
              {selectedItems.length} {selectedItems.length === 1 ? 'chat' : 'chats'} selected
            </p>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#00d9ff] border-t-transparent"></div>
            </div>
          ) : (
            <>
              {/* Contacts */}
              {filteredContacts.length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-[#2a2a2a]">
                    <p className="text-xs font-medium text-[#8696a0] uppercase tracking-wide">
                      Contacts ({filteredContacts.length})
                    </p>
                  </div>
                  {filteredContacts.map(contact => (
                    <ContactGroupItem
                      key={`contact-${contact._id}`}
                      id={contact._id}
                      name={contact.fullName}
                      avatar={contact.profilePic}
                      type="contact"
                      isSelected={selectedItems.includes(contact._id)}
                      onToggle={toggleSelection}
                    />
                  ))}
                </div>
              )}

              {/* Groups */}
              {filteredGroups.length > 0 && (
                <div>
                  <div className="px-4 py-2 bg-[#2a2a2a]">
                    <p className="text-xs font-medium text-[#8696a0] uppercase tracking-wide">
                      Groups ({filteredGroups.length})
                    </p>
                  </div>
                  {filteredGroups.map(group => (
                    <ContactGroupItem
                      key={`group-${group._id}`}
                      id={group._id}
                      name={group.name}
                      avatar={group.avatar}
                      type="group"
                      isSelected={selectedItems.includes(group._id)}
                      onToggle={toggleSelection}
                    />
                  ))}
                </div>
              )}

              {filteredContacts.length === 0 && filteredGroups.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-[#8696a0]">
                  <Search className="w-12 h-12 mb-2 opacity-50" />
                  <p>No contacts or groups found</p>
                  {searchTerm && (
                    <p className="text-sm mt-1">Try a different search term</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#3b4a54]">
          <button
            onClick={handleForward}
            disabled={selectedItems.length === 0}
            className="w-full bg-[#00d9ff] cursor-pointer text-sm text-white py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#00d9ff]/90 transition-colors"
          >
            {isBulk ? 'Forward' : 'Forward'} to {selectedItems.length} {selectedItems.length === 1 ? 'chat' : 'chats'}
          </button>
        </div>
      </div>
    </div>
  );
};

interface ContactGroupItemProps {
  id: string;
  name: string;
  avatar?: string;
  type: "contact" | "group";
  isSelected: boolean;
  onToggle: (id: string) => void;
}

const ContactGroupItem = ({ id, name, avatar, type, isSelected, onToggle }: ContactGroupItemProps) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div
      onClick={() => onToggle(id)}
      className="flex items-center gap-3 p-3 hover:bg-[#182229] cursor-pointer transition-colors"
    >
      <div className="relative">
        {avatar ? (
          <img
            src={avatar}
            alt={name}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00d9ff] to-[#025c4a] flex items-center justify-center">
            <span className="text-white font-semibold text-sm">
              {getInitials(name)}
            </span>
          </div>
        )}
        <div className="absolute -bottom-1 -right-1 bg-[#2a2f32] rounded-full p-1">
          {type === "contact" ? (
            <User className="w-3 h-3 text-[#8696a0]" />
          ) : (
            <Users className="w-3 h-3 text-[#8696a0]" />
          )}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-white font-medium truncate">{name}</p>
        <p className="text-[#8696a0] text-sm capitalize">{type}</p>
      </div>

      <div
        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
          isSelected
            ? "bg-[#00d9ff] border-[#00d9ff]"
            : "border-[#8696a0]"
        }`}
      >
        {isSelected && <Check className="w-3 h-3 text-white" />}
      </div>
    </div>
  );
};

export default ForwardModal;