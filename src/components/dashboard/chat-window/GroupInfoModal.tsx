import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Edit2, Users, Crown, LogOut, Trash2, Image as ImageIcon, 
  Check, ArrowLeft, Search, UserPlus, UserMinus, Loader2
} from 'lucide-react';
import Image from 'next/image';
import { useGroupStore, useUIStore, useAuthStore, useContactStore, useToastStore } from '@/stores';

interface GroupInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: any;
}

const GroupInfoModal = ({ isOpen, onClose, group }: GroupInfoModalProps) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'members'>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', description: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Separate loading states for each operation
  const [isSavingGroup, setIsSavingGroup] = useState(false);
  const [isDeletingGroup, setIsDeletingGroup] = useState(false);
  const [isLeavingGroup, setIsLeavingGroup] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isAddingMembers, setIsAddingMembers] = useState(false); 
  const [isRemovingMember, setIsRemovingMember] = useState<string | null>(null);
  const [isMakingAdmin, setIsMakingAdmin] = useState<string | null>(null);
  
  const { 
    updateGroup, 
    leaveGroup, 
    deleteGroup, 
    addMembersToGroup, 
    removeMemberFromGroup, 
    makeGroupAdmin,
    updateGroups,
    updateCurrentGroup,
    groups 
  } = useGroupStore();
  const { setSelectedUser } = useUIStore();
  const { authUser, socket } = useAuthStore();
  const { contacts, getAllContacts, isLoading: contactsLoading } = useContactStore();
  const { showToast } = useToastStore();
  const nameInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingActionsRef = useRef<Set<string>>(new Set());
  
  // Refs for socket deduplication - declared at top level
  const recentActionsRef = useRef<Set<string>>(new Set());

  const authUserId = authUser?._id;

  // Get the latest group data from the store
  const currentGroupData = groups.find(g => g._id === group?._id) || group;

  useEffect(() => {
    if (currentGroupData) {
      setEditForm({ 
        name: currentGroupData.name || '', 
        description: currentGroupData.description || '' 
      });
      setImagePreview(currentGroupData.groupImage || null);
    }
  }, [currentGroupData]);

  useEffect(() => {
    if (isEditing && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [isEditing]);

  useEffect(() => {
    if (showAddMembers && contacts.length === 0) {
      getAllContacts();
    }
  }, [showAddMembers, contacts.length, getAllContacts]);

  // Socket event handlers - fixed version
  // In GroupInfoModal.tsx - Simplify the socket effect to only handle UI updates, not event creation
useEffect(() => {
  if (!socket || !currentGroupData) return;

  const handleMemberAdded = (data: any) => {
    if (data.groupId === currentGroupData._id) {
      console.log('Member added via socket:', data);
      // The store will handle event messages via groupEventCreated
    }
  };

  const handleMemberRemoved = (data: any) => {
    if (data.groupId === currentGroupData._id) {
      console.log('Member removed via socket:', data);
      // The store will handle event messages via groupEventCreated
      // We only need to update UI state if needed
    }
  };

  const handleMemberPromoted = (data: any) => {
    if (data.groupId === currentGroupData._id) {
      console.log('Member promoted via socket:', data);
      // The store will handle event messages via groupEventCreated
    }
  };

  socket.on('memberAdded', handleMemberAdded);
  socket.on('memberRemoved', handleMemberRemoved);
  socket.on('memberPromoted', handleMemberPromoted);

  return () => {
    socket.off('memberAdded', handleMemberAdded);
    socket.off('memberRemoved', handleMemberRemoved);
    socket.off('memberPromoted', handleMemberPromoted);
  };
}, [socket, currentGroupData?._id]);

  const isAdmin = authUserId
    ? currentGroupData?.admins?.some((admin: any) => {
        const adminId = typeof admin === 'string' ? admin : admin._id;
        return adminId === authUserId;
      })
    : false;

  const filteredMembers = currentGroupData?.members?.map((member: any) => {
    // If member is just a string ID, try to find the full user object from contacts
    if (typeof member === 'string') {
      const contact = contacts.find(c => (c._id || c.userId?._id) === member);
      return contact?.userId || contact || { _id: member, fullName: 'Unknown' };
    }
    return member;
  }).filter((member: any) => {
    const name = member.fullName?.toLowerCase() || '';
    return name.includes(searchQuery.toLowerCase());
  }) || [];

  const availableContacts = contacts.filter(contact => {
    const contactId = contact._id || contact.userId?._id;
    return !currentGroupData?.members?.some((member: any) => {
      const memberId = typeof member === 'string' ? member : member._id;
      return memberId === contactId;
    });
  });

  const filteredAvailableContacts = availableContacts.filter(contact => {
    const name = contact.fullName || contact.userId?.fullName || '';
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleSave = async () => {
    try {
      setIsSavingGroup(true);
      console.log('Sending update with:', {
        name: editForm.name,
        description: editForm.description
      });
      
      const updatedGroup = await updateGroup(currentGroupData._id, {
        name: editForm.name,
        description: editForm.description
      });
      
      // Emit socket event for real-time updates
      if (socket) {
        socket.emit('groupUpdated', { groupId: currentGroupData._id, group: updatedGroup });
      }
      
      setIsEditing(false);
      showToast("Group updated successfully", "success");
    } catch (err) {
      console.error('Update error:', err);
      showToast("Failed to update group", "error");
    } finally {
      setIsSavingGroup(false);
    }
  };

  const handleLeave = async () => {
    if (confirm('Are you sure you want to leave this group?')) {
      try {
        setIsLeavingGroup(true);
        await leaveGroup(currentGroupData._id);
        setSelectedUser(null);
        onClose();
      } catch (error) {
        console.error('Error leaving group:', error);
        showToast("Failed to leave group", "error");
      } finally {
        setIsLeavingGroup(false);
      }
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
      try {
        setIsDeletingGroup(true);
        await deleteGroup(currentGroupData._id);
        setSelectedUser(null);
        onClose();
      } catch (error) {
        console.error('Error deleting group:', error);
        showToast("Failed to delete group", "error");
      } finally {
        setIsDeletingGroup(false);
      }
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    setIsUploadingImage(true);
    
    try {
      // Create preview
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);

      // Convert to base64 for the backend
      const base64Image = await convertToBase64(file);
      
      console.log('Uploading image, base64 length:', base64Image.length);
      
      // Update group with new image - send only the base64 string
      const updatedGroup = await updateGroup(currentGroupData._id, { 
        newImage: base64Image
      });
      
      // Emit socket event
      if (socket) {
        socket.emit('groupUpdated', { groupId: currentGroupData._id, group: updatedGroup });
      }
      
      showToast("Group image updated successfully", "success");
    } catch (error) {
      console.error('Error uploading image:', error);
      showToast("Failed to upload image", "error");
      // Revert preview on error
      setImagePreview(currentGroupData.groupImage || null);
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        // Get the full data URL (includes the data:image/...;base64, prefix)
        const dataUrl = reader.result as string;
        resolve(dataUrl);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleAddMembers = async () => {
    if (selectedContacts.length === 0 || !currentGroupData?._id) return;

    try {
      setIsAddingMembers(true);
      console.log('🔵 [ADD MEMBERS] Starting...', {
        groupId: currentGroupData._id,
        currentMemberCount: currentGroupData.members?.length,
        addingCount: selectedContacts.length
      });
      
      const updatedGroup = await addMembersToGroup(currentGroupData._id, selectedContacts);
      
      if (!updatedGroup) {
        throw new Error('No response from addMembersToGroup');
      }
      
      console.log('🟢 [ADD MEMBERS] API Response:', {
        groupId: updatedGroup._id,
        newMemberCount: updatedGroup.members?.length,
        members: updatedGroup.members
      });
      
      // Force update the store with the new group data
      updateGroups(updatedGroup);
      updateCurrentGroup(updatedGroup);
      
      console.log('🟡 [ADD MEMBERS] Store updated, checking groups array...');
      const storeGroups = useGroupStore.getState().groups;
      const groupInStore = storeGroups.find(g => g._id === updatedGroup._id);
      console.log('🟡 [ADD MEMBERS] Group in store:', {
        found: !!groupInStore,
        memberCount: groupInStore?.members?.length
      });
      
      // Emit socket event
      if (socket) {
        socket.emit('memberAdded', { 
          groupId: currentGroupData._id, 
          newMembers: selectedContacts.map(id => ({ _id: id }))
        });
        socket.emit('groupUpdated', { groupId: currentGroupData._id, group: updatedGroup });
      }
      
      // Add event messages for new members
      selectedContacts.forEach(contactId => {
        const contact = contacts.find(c => (c._id || c.userId?._id) === contactId);
        const contactName = contact?.fullName || contact?.userId?.fullName || 'User';
        
        useGroupStore.getState().addGroupEventMessage({
          type: 'member_joined',
          userId: contactId,
          userName: contactName,
          groupId: currentGroupData._id
        });
      });
      
      setSelectedContacts([]);
      setShowAddMembers(false);
      setSearchQuery('');
      showToast("Members added successfully", "success");
    } catch (error) {
      console.error('🔴 [ADD MEMBERS] Error:', error);
      showToast("Failed to add members", "error");
    } finally {
      setIsAddingMembers(false);
    }
  };

  // In GroupInfoModal.tsx - Update the handleRemoveMember function
const handleRemoveMember = async (memberId: string, memberName: string) => {
  // Prevent duplicate actions
  const actionKey = `remove_${memberId}`;
  if (pendingActionsRef.current.has(actionKey)) {
    console.log('🟡 Action already in progress, skipping');
    return;
  }

  if (confirm(`Are you sure you want to remove ${memberName} from the group?`)) {
    try {
      pendingActionsRef.current.add(actionKey);
      setIsRemovingMember(memberId);
      
      console.log('🟠 [REMOVE MEMBER] Starting...', { groupId: currentGroupData._id, memberId });
      
      const updatedGroup = await removeMemberFromGroup(currentGroupData._id, memberId);
      
      console.log('🟢 [REMOVE MEMBER] API Response received');
      
      // Force update the store with the new group data
      updateGroups(updatedGroup);
      updateCurrentGroup(updatedGroup);
      
      // ⚠️ REMOVED: Don't manually create event message here
      // The server will automatically create the event via the API
      // and broadcast it via socket, which we'll handle in the store
      
      // Emit socket event only once
      if (socket) {
        console.log('🔵 [REMOVE MEMBER] Emitting socket events');
        socket.emit('memberRemoved', { 
          groupId: currentGroupData._id, 
          removedMemberId: memberId,
          removedMemberName: memberName
        });
        socket.emit('groupUpdated', { groupId: currentGroupData._id, group: updatedGroup });
      }
      
      showToast("Member removed successfully", "success");
    } catch (error) {
      console.error('🔴 [REMOVE MEMBER] Error:', error);
      showToast("Failed to remove member", "error");
    } finally {
      setIsRemovingMember(null);
      pendingActionsRef.current.delete(actionKey);
    }
  }
};

// Also update handleMakeAdmin similarly
const handleMakeAdmin = async (memberId: string, memberName: string) => {
  // Prevent duplicate actions
  const actionKey = `promote_${memberId}`;
  if (pendingActionsRef.current.has(actionKey)) {
    console.log('🟡 Action already in progress, skipping');
    return;
  }

  if (confirm(`Are you sure you want to make ${memberName} an admin?`)) {
    try {
      pendingActionsRef.current.add(actionKey);
      setIsMakingAdmin(memberId);
      
      console.log('🟠 [MAKE ADMIN] Starting...', { groupId: currentGroupData._id, memberId });
      
      const updatedGroup = await makeGroupAdmin(currentGroupData._id, memberId);
      
      console.log('🟢 [MAKE ADMIN] API Response received');
      
      // Force update the store with the new group data
      updateGroups(updatedGroup);
      updateCurrentGroup(updatedGroup);
      
      // ⚠️ REMOVED: Don't manually create event message here
      // The server will handle event creation
      
      // Emit socket event only once
      if (socket) {
        console.log('🔵 [MAKE ADMIN] Emitting socket events');
        socket.emit('memberPromoted', { 
          groupId: currentGroupData._id, 
          newAdminId: memberId,
          admins: updatedGroup.admins
        });
        socket.emit('groupUpdated', { groupId: currentGroupData._id, group: updatedGroup });
      }
      
      showToast("Admin role updated successfully", "success");
    } catch (error) {
      console.error('🔴 [MAKE ADMIN] Error:', error);
      showToast("Failed to promote user to admin", "error");
    } finally {
      setIsMakingAdmin(null);
      pendingActionsRef.current.delete(actionKey);
    }
  }
};
  const toggleContactSelection = (contactId: string) => {
    setSelectedContacts(prev =>
      prev.includes(contactId)
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const handleCancelEdit = () => {
    setEditForm({ 
      name: currentGroupData.name, 
      description: currentGroupData.description || '' 
    });
    setImagePreview(currentGroupData.groupImage || null);
    setIsEditing(false);
  };

  if (!isOpen || !authUser) return null;

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
            style={{ maxHeight: '100vh' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3 bg-[#1e1e1e] border-b border-[#2a2a2a]">
              {showAddMembers ? (
                <>
                  <button
                    onClick={() => setShowAddMembers(false)}
                    className="p-2 rounded-full hover:bg-[#2a2a2a] transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5 text-white" />
                  </button>
                  <h2 className="text-lg font-medium text-white">Add Members</h2>
                  <button
                    onClick={handleAddMembers}
                    disabled={selectedContacts.length === 0 || isAddingMembers}
                    className="p-2 text-[#00d9ff] text-sm disabled:text-[#666] disabled:cursor-not-allowed"
                  >
                    {isAddingMembers ? 'Adding' : 'Add'}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-[#2a2a2a] transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5 text-white" />
                  </button>
                  <h2 className="text-lg font-medium text-white">Group Info</h2>
                  <div className="w-9" />
                </>
              )}
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
              {showAddMembers ? (
                <div className="p-4">
                  {/* Search */}
                  <div className="mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666]" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search contacts"
                        className="w-full pl-10 pr-4 py-2 bg-[#1e1e1e] rounded-lg text-sm text-white placeholder-[#666] focus:outline-none focus:ring-2 focus:ring-[#00d9ff]"
                      />
                    </div>
                  </div>

                  {/* Contact List */}
                  <div className="space-y-2">
                    {contactsLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00d9ff] mx-auto"></div>
                        <p className="text-[#999] mt-2">Loading contacts...</p>
                      </div>
                    ) : filteredAvailableContacts.length === 0 ? (
                      <div className="text-center py-8 text-[#999]">
                        {searchQuery ? 'No contacts found' : 'No contacts available to add'}
                      </div>
                    ) : (
                      filteredAvailableContacts.map((contact) => {
                        const contactId = contact._id || contact.userId?._id;
                        const name = contact.fullName || contact.userId?.fullName || 'Unknown';
                        const pic = contact.profilePic || contact.userId?.profilePic;

                        return (
                          <div
                            key={contactId}
                            onClick={() => toggleContactSelection(contactId)}
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#1e1e1e] transition-colors cursor-pointer"
                          >
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

                            <div className="flex-1 min-w-0">
                              <p className="text-white font-medium truncate">{name}</p>
                            </div>

                            <div className={`w-6 h-6 rounded-full border-2 transition-colors ${
                              selectedContacts.includes(contactId)
                                ? 'bg-[#00d9ff] border-[#00d9ff]'
                                : 'border-[#666]'
                            }`}>
                              {selectedContacts.includes(contactId) && (
                                <Check className="w-4 h-4 text-white" />
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {/* Group Header */}
                  <div className="bg-gradient-to-b from-[#1a1a1a] to-[#111111] px-5 pt-6 pb-8">
                    <div className="flex flex-col items-center">
                      <div className="relative">
                        <div className="w-24 h-24 rounded-full overflow-hidden bg-[#2a2a2a] ring-4 ring-[#111111] relative">
                          {imagePreview ? (
                            <Image
                              src={imagePreview}
                              alt={currentGroupData.name}
                              width={96}
                              height={96}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Users className="w-12 h-12 text-[#666]" />
                            </div>
                          )}
                          {isUploadingImage && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <Loader2 className='animate-spin h-6 w-6 text-white' />
                            </div>
                          )}
                        </div>
                        {isAdmin && (
                          <>
                            <input
                              type="file"
                              ref={fileInputRef}
                              onChange={handleImageUpload}
                              accept="image/*"
                              className="hidden"
                            />
                            <button 
                              onClick={() => fileInputRef.current?.click()}
                              disabled={isUploadingImage}
                              className="absolute bottom-0 right-0 p-2 bg-[#00d9ff] rounded-full shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Edit2 className="w-4 h-4 text-white" />
                            </button>
                          </>
                        )}
                      </div>

                      <div className="mt-4 w-full">
                        {isEditing ? (
                          <input
                            ref={nameInputRef}
                            type="text"
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="w-full px-3 py-2 bg-[#2a2a2a] rounded-lg text-white text-center text-xl font-semibold focus:outline-none focus:ring-2 focus:ring-[#00d9ff]"
                            placeholder="Group name"
                          />
                        ) : (
                          <h3 className="text-xl font-semibold text-white text-center">{currentGroupData.name}</h3>
                        )}
                        <p className="text-sm text-[#999] text-center mt-1">
                          {currentGroupData.members?.length || 0} members
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="sticky top-0 bg-[#111111] z-10 border-b border-[#2a2a2a]">
                    <div className="flex">
                      {['overview', 'members'].map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab as any)}
                          className={`flex-1 py-3 text-sm font-medium cursor-pointer capitalize transition-colors relative ${
                            activeTab === tab
                              ? 'text-[#00d9ff]'
                              : 'text-[#999] hover:text-white'
                          }`}
                        >
                          {tab === 'members' ? `Members (${currentGroupData.members?.length})` : 'Overview'}
                          {activeTab === tab && (
                            <motion.div
                              layoutId="activeTab"
                              className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00d9ff]"
                            />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tab Content */}
                  <div className="px-5 py-4">
                    <AnimatePresence mode="wait">
                      {activeTab === 'overview' && (
                        <motion.div
                          key="overview"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          className="space-y-5"
                        >
                          {/* Description */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-[#999]">Description</span>
                              {isAdmin && !isEditing && (
                                <button
                                  onClick={() => setIsEditing(true)}
                                  className="text-xs text-[#00d9ff] flex items-center gap-1"
                                >
                                  <Edit2 className="w-3 h-3" /> Edit
                                </button>
                              )}
                            </div>
                            {isEditing ? (
                              <textarea
                                value={editForm.description}
                                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                className="w-full p-3 bg-[#1e1e1e] rounded-lg text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#00d9ff]"
                                rows={3}
                                placeholder="Add a description"
                              />
                            ) : (
                              <p className="text-[#ccc] text-sm leading-relaxed">
                                {currentGroupData.description || 'No description added.'}
                              </p>
                            )}
                          </div>

                          {isEditing && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="flex gap-2"
                            >
                              <button
                                onClick={handleCancelEdit}
                                disabled={isSavingGroup}
                                className="flex-1 py-2 text-sm text-[#999] cursor-pointer hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={handleSave}
                                disabled={isSavingGroup}
                                className="flex-1 py-2 bg-[#00d9ff] cursor-pointer text-white rounded-lg text-sm font-medium hover:bg-[#00b8d4] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                              >
                                {isSavingGroup ? (
                                  <>
                                    <Loader2 className='animate-spin h-4 w-4 text-white' />
                                    Saving...
                                  </>
                                ) : (
                                  'Save'
                                )}
                              </button>
                            </motion.div>
                          )}

                          <div className="h-px bg-[#2a2a2a]" />

                          {/* Actions */}
                          <div className="space-y-1">
                            {isAdmin ? (
                              <button
                                onClick={handleDelete}
                                disabled={isDeletingGroup}
                                className="w-full flex items-center text-sm cursor-pointer justify-center gap-3 p-3 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <span className="font-medium">
                                  {isDeletingGroup ? (
                                    <div className='flex gap-2 items-center'>
                                      <Loader2 className='w-4 h-4 animate-spin' />
                                      Deleting...
                                    </div>
                                  ) : (
                                    <div className='flex gap-2 items-center'>
                                      <Trash2 className='h-4 w-4' />
                                      Delete Group
                                    </div>
                                  )}
                                </span>
                              </button>
                            ) : (
                              <button
                                onClick={handleLeave}
                                disabled={isLeavingGroup}
                                className="w-full flex items-center justify-center text-sm cursor-pointer gap-3 p-3 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <LogOut className="w-5 h-5" />
                                <span className="font-medium">
                                  {isLeavingGroup ? (
                                    <div className='flex gap-2 items-center'>
                                      <Loader2 className='h-4 w-4 animate-spin' />
                                      Leaving...
                                    </div>
                                  ) : (
                                    'Leave Group'
                                  )}
                                </span>
                              </button>
                            )}
                          </div>
                        </motion.div>
                      )}

                      {activeTab === 'members' && (
                        <motion.div
                          key="members"
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                        >
                          {/* Search */}
                          <div className="mb-4">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666]" />
                              <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search members"
                                className="w-full pl-10 pr-4 py-2 bg-[#1e1e1e] rounded-lg text-sm text-white placeholder-[#666] focus:outline-none focus:ring-2 focus:ring-[#00d9ff]"
                              />
                            </div>
                          </div>

                          {/* Member List */}
                          <div className="space-y-1 max-h-96 overflow-y-auto">
                            {filteredMembers.map((member: any) => {
                              const id = member._id;
                              const name = member.fullName || 'Unknown';
                              const pic = member.profilePic;
                              const isMemberAdmin = currentGroupData.admins?.some((a: any) => {
                                const adminId = typeof a === 'string' ? a : a._id;
                                return adminId === id;
                              });
                              const isSelf = id === authUserId;
                              const isRemovingThisMember = isRemovingMember === id;
                              const isMakingThisAdmin = isMakingAdmin === id;

                              return (
                                <div
                                  key={id}
                                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#1e1e1e] transition-colors group"
                                >
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
                                      {(isRemovingThisMember || isMakingThisAdmin) && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        </div>
                                      )}
                                    </div>
                                    {isMemberAdmin && (
                                      <Crown className="absolute -top-1 -right-1 w-4 h-4 text-yellow-500 fill-yellow-500" />
                                    )}
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <p className="text-white font-medium truncate">
                                      {name} {isSelf && <span className="text-[#999] text-xs">(You)</span>}
                                    </p>
                                    <p className="text-xs text-[#999]">{isMemberAdmin ? 'Admin' : 'Member'}</p>
                                  </div>

                                  {isAdmin && !isSelf && (
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      {!isMemberAdmin && (
                                        <button 
                                          onClick={() => handleMakeAdmin(id, name)}
                                          disabled={isMakingThisAdmin || isRemovingThisMember}
                                          className="p-1.5 bg-[#2a2a2a] rounded hover:bg-[#3a3a3a] disabled:opacity-50 disabled:cursor-not-allowed"
                                          title="Make Admin"
                                        >
                                          {isMakingThisAdmin ? (
                                            <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-[#00d9ff]"></div>
                                          ) : (
                                            <Crown className="w-3.5 h-3.5 text-[#00d9ff]" />
                                          )}
                                        </button>
                                      )}
                                      <button 
                                        onClick={() => handleRemoveMember(id, name)}
                                        disabled={isRemovingThisMember || isMakingThisAdmin}
                                        className="p-1.5 bg-red-500/20 rounded hover:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="Remove Member"
                                      >
                                        {isRemovingThisMember ? (
                                          <Loader2 className='w-3.5 h-3.5 animate-spin text-red-500' />
                                        ) : (
                                          <UserMinus className="w-3.5 h-3.5 text-red-500" />
                                        )}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {isAdmin && (
                            <button 
                              onClick={() => setShowAddMembers(true)}
                              disabled={isAddingMembers}
                              className="mt-6 w-full py-3 text-sm cursor-pointer bg-[#00d9ff]/10 text-[#00d9ff] rounded-lg font-medium hover:bg-[#00d9ff]/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isAddingMembers ? (
                                <>
                                  <Loader2 className='w-5 h-5 animate-spin' />
                                  Adding Members...
                                </>
                              ) : (
                                <>
                                  <UserPlus className="w-5 h-5" />
                                  Add Members
                                </>
                              )}
                            </button>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default GroupInfoModal;