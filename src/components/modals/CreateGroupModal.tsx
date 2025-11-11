"use client";

import React, { useState, useRef } from 'react';
import { X, Camera, User, Loader2, Check, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useGroupStore, useContactStore, useToastStore, useAuthStore } from '@/stores';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ isOpen, onClose }) => {
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { createGroup, isCreatingGroup, joinGroupRoom } = useGroupStore();
  const { contacts } = useContactStore();
  const { showToast } = useToastStore();
  const { authUser } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (e.g., 5MB max)
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size should be less than 5MB', 'error');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file', 'error');
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      setSelectedImage(reader.result as string);
    };
  };

  const toggleMemberSelection = (contactId: string) => {
    setSelectedMembers(prev =>
      prev.includes(contactId)
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!groupName.trim()) {
      showToast('Group name is required', 'error');
      return;
    }

    if (selectedMembers.length === 0) {
      showToast('Please select at least one member', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      // Include current user in members automatically
      const allMembers = authUser?._id 
        ? [...selectedMembers, authUser._id] 
        : selectedMembers;

      const newGroup = await createGroup({
        name: groupName.trim(),
        description: groupDescription,
        members: allMembers,
        groupImage: selectedImage || undefined,
      });

      // Automatically join the group room after creation
      if (newGroup?._id) {
        joinGroupRoom(newGroup._id);
      }

      showToast('Group created successfully', 'success');
      handleClose();
    } catch (error: any) {
      console.error('Group creation error:', error);
      showToast(error.message || 'Failed to create group', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setGroupName('');
    setGroupDescription('');
    setSelectedMembers([]);
    setSelectedImage(null);
    setIsSubmitting(false);
    onClose();
  };

  // Filter out current user from contacts to avoid self-selection
  const filteredContacts = contacts?.filter(contact => 
    contact._id !== authUser?._id
  ) || [];

  const isSubmitDisabled = isSubmitting || isCreatingGroup || !groupName.trim() || selectedMembers.length === 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: -20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: -20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 top-0 max-w-md mx-auto md:mt-5 h-screen md:h-[500px] bg-[#111111] z-50 flex flex-col"
            style={{ maxHeight: '100vh' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 bg-[#1e1e1e] border-b border-[#2a2a2a]">
              <button
                onClick={handleClose}
                className="p-2 rounded-full cursor-pointer hover:bg-[#2a2a2a] transition-colors"
                disabled={isSubmitting || isCreatingGroup}
              >
                <X className="w-5 h-5 text-white" />
              </button>
              <h2 className="text-lg font-medium text-white">Create Group</h2>
              <div className="w-9" />
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              {/* Group Image */}
              <div className="flex justify-center">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-24 h-24 rounded-full overflow-hidden bg-[#2a2a2a] ring-4 ring-[#111111] hover:ring-[#00d9ff] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isSubmitting || isCreatingGroup}
                  >
                    {selectedImage ? (
                      <Image
                        src={selectedImage}
                        alt="Group"
                        width={96}
                        height={96}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Camera className="w-10 h-10 text-[#666]" />
                      </div>
                    )}
                  </button>
                  <div className="absolute cursor-pointer inset-0 rounded-full bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={isSubmitting || isCreatingGroup}
                  />
                </div>
              </div>

              {/* Group Name */}
              <div>
                <label className="text-sm text-[#999] mb-2 block">
                  Group Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Enter group name"
                  className="w-full px-3 py-2 bg-[#1e1e1e] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#00d9ff] disabled:opacity-50 disabled:cursor-not-allowed"
                  maxLength={50}
                  disabled={isSubmitting || isCreatingGroup}
                />
                <p className="text-right text-xs text-[#666] mt-1">{groupName.length}/50</p>
              </div>

              {/* Description */}
              <div>
                <label className="text-sm text-[#999] mb-2 block">Description (optional)</label>
                <textarea
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  placeholder="What's this group about?"
                  rows={3}
                  className="w-full p-3 bg-[#1e1e1e] rounded-lg text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#00d9ff] disabled:opacity-50 disabled:cursor-not-allowed"
                  maxLength={1000}
                  disabled={isSubmitting || isCreatingGroup}
                />
                <p className="text-right text-xs text-[#666] mt-1">{groupDescription.length}/1000</p>
              </div>

              {/* Members */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-[#999]">
                    Add Members <span className="text-red-500">*</span>
                  </label>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#00d9ff]/10 text-[#00d9ff]">
                    {selectedMembers.length} selected
                  </span>
                </div>

                <div className="max-h-64 overflow-y-auto space-y-1">
                  {filteredContacts && filteredContacts.length > 0 ? (
                    filteredContacts.map((contact) => {
                      const isSelected = selectedMembers.includes(contact._id);
                      return (
                        <div
                          key={contact._id}
                          onClick={() => !isSubmitting && !isCreatingGroup && toggleMemberSelection(contact._id)}
                          className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                            isSelected ? "bg-[#00d9ff]/10" : "hover:bg-[#1e1e1e]"
                          } ${(isSubmitting || isCreatingGroup) ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          <div className="relative flex-shrink-0">
                            <div className="w-11 h-11 rounded-full overflow-hidden bg-[#2a2a2a]">
                              {contact.profilePic ? (
                                <Image
                                  src={contact.profilePic}
                                  alt={contact.fullName}
                                  width={44}
                                  height={44}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-sm font-bold text-[#00d9ff]">
                                  {contact.fullName.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium truncate">{contact.fullName}</p>
                            {contact.email && (
                              <p className="text-xs text-[#999] truncate">{contact.email}</p>
                            )}
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
                    })
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 rounded-xl bg-[#2a2a2a] flex items-center justify-center mx-auto mb-3">
                        <User className="w-8 h-8 text-[#666]" />
                      </div>
                      <p className="text-[#ccc]">No contacts available</p>
                      <p className="text-[#999] text-sm mt-1">Add contacts to create a group</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[#2a2a2a] bg-[#1e1e1e] space-y-3">
              <div className="flex gap-2">
                <button
                  onClick={handleClose}
                  disabled={isSubmitting || isCreatingGroup}
                  className="flex-1 py-2 text-sm cursor-pointer text-[#999] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitDisabled}
                  className="flex-1 py-2 bg-[#00d9ff] cursor-pointer text-black rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-[#00b8d4] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {(isSubmitting || isCreatingGroup) ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Users className="w-4 h-4" />
                      Create Group
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CreateGroupModal;