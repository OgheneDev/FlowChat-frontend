import React, { useState, useEffect } from "react";
import { X, Search, User, Users, Check, MessageSquare, Send, Image as ImageIcon } from "lucide-react";
import { usePrivateChatStore } from "@/stores";
import { useGroupStore } from "@/stores";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

interface Contact {
  _id: string;
  fullName: string;
  profilePic?: string;
  type: "contact";
}

interface Group {
  _id: string;
  name: string;
  groupImage?: string;
  type: "group";
}

interface ForwardModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: {
    text?: string;
    image?: string;
  };
  messages?: any[];
  onForward: (selectedIds: string[], messages: any[]) => void;
  isBulk?: boolean;
}

const ForwardModal = ({
  isOpen,
  onClose,
  message,
  messages = [],
  onForward,
  isBulk = false,
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
        getMyGroups(),
      ]);

      const transformedContacts: Contact[] = contactsData.map((chat: any) => ({
        _id: chat._id,
        fullName: chat.fullName || chat.participantDetails?.[0]?.fullName || "Unknown",
        profilePic: chat.profilePic || chat.participantDetails?.[0]?.profilePic,
        type: "contact" as const,
      }));

      const transformedGroups: Group[] = groupsData.map((group: any) => ({
        _id: group._id,
        name: group.name,
        groupImage: group.groupImage,
        type: "group" as const,
      }));

      setContacts(transformedContacts);
      setGroups(transformedGroups);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredContacts = contacts.filter((c) =>
    c.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredGroups = groups.filter((g) =>
    g.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleSelection = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleForward = () => {
    if (selectedItems.length === 0) return;
    const messagesToForward = isBulk ? messages : message ? [message] : [];
    onForward(selectedItems, messagesToForward);
    onClose();
  };

  const getMessagePreview = () => {
    if (isBulk && messages.length > 0) {
      return messages.length === 1
        ? messages[0].text
          ? messages[0].text.length > 30
            ? messages[0].text.substring(0, 30) + "..."
            : messages[0].text
          : messages[0].image
          ? "Photo"
          : "Message"
        : `${messages.length} messages`;
    }
    if (message) {
      return message.text
        ? message.text.length > 30
          ? message.text.substring(0, 30) + "..."
          : message.text
        : message.image
        ? "Photo"
        : "Message";
    }
    return "";
  };

  const hasImage = () => {
    if (isBulk) return messages.some((m) => m.image);
    return !!message?.image;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: -20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: -20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 top-0 max-w-md mx-auto md:mt-5 h-screen md:h-[500px] bg-[#111111] z-50 flex flex-col"
            style={{ maxHeight: "100vh" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 bg-[#1e1e1e] border-b border-[#2a2a2a]">
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-[#2a2a2a] transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
              <h2 className="text-lg font-medium text-white">
                Forward {isBulk ? "Messages" : "Message"}
              </h2>
              <div className="w-9" />
            </div>

            {/* Message Preview */}
            {(message || (isBulk && messages.length > 0)) && (
              <div className="px-5 py-3 bg-[#1a1a1a] border-b border-[#2a2a2a]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#2a2a2a] flex items-center justify-center">
                    {hasImage() ? (
                      <ImageIcon className="w-5 h-5 text-[#00d9ff]" />
                    ) : (
                      <MessageSquare className="w-5 h-5 text-[#00d9ff]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[#999] mb-1">Forwarding:</p>
                    <p className="text-white text-sm truncate">{getMessagePreview()}</p>
                    {isBulk && messages.length > 1 && (
                      <span className="inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full bg-[#00d9ff]/10 text-[#00d9ff]">
                        {messages.length} items
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Search */}
            <div className="p-4 border-b border-[#2a2a2a]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666]" />
                <input
                  type="text"
                  placeholder="Search contacts and groups"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-[#1e1e1e] rounded-lg text-sm text-white placeholder-[#666] focus:outline-none focus:ring-2 focus:ring-[#00d9ff]"
                />
              </div>
            </div>

            {/* Selected Count */}
            {selectedItems.length > 0 && (
              <div className="px-5 py-2 bg-[#1e1e1e] border-b border-[#2a2a2a]">
                <p className="text-sm text-[#00d9ff] font-medium">
                  {selectedItems.length} selected
                </p>
              </div>
            )}

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#00d9ff]/20 border-t-[#00d9ff]" />
                  <p className="text-[#999] text-sm mt-3">Loading chats...</p>
                </div>
              ) : (
                <>
                  {/* Contacts */}
                  {filteredContacts.length > 0 && (
                    <div>
                      <div className="px-5 py-2 bg-[#1e1e1e] sticky top-0 z-10 border-b border-[#2a2a2a]">
                        <p className="text-xs font-medium text-[#999] uppercase tracking-wider">
                          Contacts ({filteredContacts.length})
                        </p>
                      </div>
                      {filteredContacts.map((contact) => (
                        <ContactItem
                          key={contact._id}
                          {...contact}
                          isSelected={selectedItems.includes(contact._id)}
                          onToggle={toggleSelection}
                        />
                      ))}
                    </div>
                  )}

                  {/* Groups */}
                  {filteredGroups.length > 0 && (
                    <div className={filteredContacts.length > 0 ? "mt-4" : ""}>
                      <div className="px-5 py-2 bg-[#1e1e1e] sticky top-0 z-10 border-b border-[#2a2a2a]">
                        <p className="text-xs font-medium text-[#999] uppercase tracking-wider">
                          Groups ({filteredGroups.length})
                        </p>
                      </div>
                      {filteredGroups.map((group) => (
                        <GroupItem
                          key={group._id}
                          {...group}
                          isSelected={selectedItems.includes(group._id)}
                          onToggle={toggleSelection}
                        />
                      ))}
                    </div>
                  )}

                  {filteredContacts.length === 0 && filteredGroups.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 px-5 text-center">
                      <div className="w-16 h-16 rounded-xl bg-[#2a2a2a] flex items-center justify-center mb-3">
                        <Search className="w-8 h-8 text-[#666]" />
                      </div>
                      <p className="text-[#ccc] font-medium">No chats found</p>
                      <p className="text-[#999] text-sm mt-1">
                        {searchTerm ? "Try a different search" : "Start a chat to forward messages"}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Forward Button */}
            <div className="p-4 border-t border-[#2a2a2a] bg-[#1e1e1e]">
              <button
                onClick={handleForward}
                disabled={selectedItems.length === 0}
                className="w-full py-3 bg-[#00d9ff] cursor-pointer text-black rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-[#00b8d4] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
                Forward to {selectedItems.length} chat{selectedItems.length !== 1 ? "s" : ""}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Reusable Contact Item
const ContactItem = ({
  _id,
  fullName,
  profilePic,
  isSelected,
  onToggle,
}: Contact & { isSelected: boolean; onToggle: (id: string) => void }) => {
  return (
    <div
      onClick={() => onToggle(_id)}
      className={`flex items-center gap-3 p-3 mx-5 my-1 rounded-lg cursor-pointer transition-colors
      }`}
    >
      <div className="relative flex-shrink-0">
        <div className="w-11 h-11 rounded-full overflow-hidden bg-[#2a2a2a]">
          {profilePic ? (
            <Image
              src={profilePic}
              alt={fullName}
              width={44}
              height={44}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sm font-bold text-[#00d9ff]">
              {fullName.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-medium truncate">{fullName}</p>
        <p className="text-xs text-[#999]">Contact</p>
      </div>
      <div
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
          isSelected
            ? "bg-[#00d9ff] border-[#00d9ff]"
            : "border-[#666]"
        }`}
      >
        {isSelected && <Check className="w-3 h-3 text-black" strokeWidth={3} />}
      </div>
    </div>
  );
};

// Reusable Group Item
const GroupItem = ({
  _id,
  name,
  groupImage,
  isSelected,
  onToggle,
}: Group & { isSelected: boolean; onToggle: (id: string) => void }) => {
  return (
    <div
      onClick={() => onToggle(_id)}
      className={`flex items-center gap-3 p-3 mx-5 my-1 rounded-lg cursor-pointer transition-colors`}
    >
      <div className="relative flex-shrink-0">
        <div className="w-11 h-11 rounded-full overflow-hidden bg-[#2a2a2a]">
          {groupImage ? (
            <Image
              src={groupImage}
              alt={name}
              width={44}
              height={44}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Users className="w-6 h-6 text-[#666]" />
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-medium truncate">{name}</p>
        <p className="text-xs text-[#999]">Group</p>
      </div>
      <div
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
          isSelected
            ? "bg-[#00d9ff] border-[#00d9ff]"
            : "border-[#666]"
        }`}
      >
        {isSelected && <Check className="w-3 h-3 text-black" strokeWidth={3} />}
      </div>
    </div>
  );
};

export default ForwardModal;