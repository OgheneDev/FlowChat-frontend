"use client";

import React, { useState, useRef } from 'react';
import { X, Camera, User, Loader2 } from 'lucide-react';
import { useGroupStore } from '@/stores';
import { useToastStore } from '@/stores';
import { useContactStore } from '@/stores';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ isOpen, onClose }) => {
  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { createGroup, isCreatingGroup } = useGroupStore();
  const { contacts } = useContactStore();
  const { showToast } = useToastStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
      await createGroup({
        name: groupName.trim(),
        members: selectedMembers,
        groupImage: selectedImage || undefined,
      });
      
      showToast('Group created successfully', 'success');
      handleClose();
    } catch (error: any) {
      showToast(error.message || 'Failed to create group', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setGroupName('');
    setSelectedMembers([]);
    setSelectedImage(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1e1e1e] rounded-xl w-full max-w-md border border-[#2a2a2a]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#2a2a2a]">
          <h2 className="text-lg font-semibold text-white">Create New Group</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-[#2a2a2a] rounded-lg transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-[#999999]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Group Image Upload */}
          <div className="flex justify-center mb-6">
            <div className="relative group">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="size-20 rounded-full cursor-pointer overflow-hidden ring-2 ring-[#2a2a2a] focus:ring-[#00d9ff] transition-all duration-200"
                aria-label="Upload group image"
              >
                {selectedImage ? (
                  <img src={selectedImage} alt="Group" className="size-full object-cover" />
                ) : (
                  <div className="size-full bg-[#2a2a2a] flex items-center justify-center">
                    <Camera className="w-8 h-8 text-[#999999]" />
                  </div>
                )}
              </button>
              
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-full flex items-center justify-center pointer-events-none">
                <Camera className="w-5 h-5 text-white" />
              </div>

              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Group Name */}
          <div className="mb-6">
            <label htmlFor="groupName" className="block text-sm font-medium text-[#999999] mb-2">
              Group Name
            </label>
            <input
              type="text"
              id="groupName"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name"
              className="w-full px-3 py-2.5 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg text-white placeholder-[#666] focus:outline-none focus:border-[#00d9ff] focus:ring-2 focus:ring-[#00d9ff]/20 transition-all duration-200"
              maxLength={50}
            />
          </div>

          {/* Select Members */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-[#999999] mb-2">
              Select Members ({selectedMembers.length} selected)
            </label>
            
            <div className="max-h-48 overflow-y-auto bg-[#2a2a2a] rounded-lg border border-[#3a3a3a]">
              {contacts && contacts.length > 0 ? (
                contacts.map((contact) => (
                  <div
                    key={contact._id}
                    className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${
                      selectedMembers.includes(contact._id)
                        ? 'bg-[#00d9ff]/10'
                        : 'hover:bg-[#3a3a3a]'
                    }`}
                    onClick={() => toggleMemberSelection(contact._id)}
                  >
                    <div className="w-10 h-10 rounded-full bg-[#1e1e1e] flex items-center justify-center overflow-hidden">
                      {contact.profilePic ? (
                        <img src={contact.profilePic} alt={contact.fullName} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-5 h-5 text-[#999999]" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-sm font-medium">{contact.fullName}</p>
                    </div>
                    <div
                      className={`w-5 h-5 rounded border-2 transition-colors ${
                        selectedMembers.includes(contact._id)
                          ? 'bg-[#00d9ff] border-[#00d9ff]'
                          : 'border-[#666]'
                      }`}
                    />
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-[#999999] text-sm">
                  No contacts available. Add contacts to create a group.
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-2.5 px-4 text-sm bg-[#2a2a2a] text-white rounded-lg hover:bg-[#3a3a3a] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isCreatingGroup || !groupName.trim() || selectedMembers.length === 0}
              className="flex-1 py-2.5 px-4 bg-[#00d9ff] text-sm text-black rounded-lg hover:bg-[#00c4e6] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {(isSubmitting || isCreatingGroup) ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Group'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;