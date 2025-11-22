import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGroupStore, useUIStore, useAuthStore, useContactStore, useToastStore } from '@/stores';
import GroupImageUploader from './GroupImageUploader'
import GroupInfoHeader from './GroupInfoHeader';
import GroupOverview from './GroupOverview'
import GroupMembersList from './GroupMembersList'
import AddMembersPanel from './AddMembersPanel'

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
            {/* Header (handles back/add button depending on mode) */}
            <GroupInfoHeader
              showAddMembers={showAddMembers}
              onBack={() => setShowAddMembers(false)}
              onClose={onClose}
              onAdd={handleAddMembers}
              isAdding={isAddingMembers}
            />

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
              {showAddMembers ? (
                <AddMembersPanel
                  contacts={contacts}
                  contactsLoading={contactsLoading}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  filteredAvailableContacts={filteredAvailableContacts}
                  selectedContacts={selectedContacts}
                  toggleContactSelection={toggleContactSelection}
                  onAddMembers={handleAddMembers}
                  isAddingMembers={isAddingMembers}
                />
              ) : (
                <>
                  {/* Group header: image + title */}
                  <GroupImageUploader
                    imagePreview={imagePreview}
                    isAdmin={isAdmin}
                    isUploading={isUploadingImage}
                    fileInputRef={fileInputRef}
                    onUpload={handleImageUpload}
                    groupName={currentGroupData?.name}
                  />

                  {/* Tabs and corresponding content */}
                  <div className="px-5 py-4">
                    {/* Overview */}
                    <GroupOverview
                      activeTab={activeTab}
                      setActiveTab={setActiveTab}
                      isEditing={isEditing}
                      setIsEditing={setIsEditing}
                      editForm={editForm}
                      setEditForm={setEditForm}
                      handleSave={handleSave}
                      handleCancelEdit={handleCancelEdit}
                      isSavingGroup={isSavingGroup}
                      isAdmin={isAdmin}
                      handleDelete={handleDelete}
                      isDeletingGroup={isDeletingGroup}
                      handleLeave={handleLeave}
                      isLeavingGroup={isLeavingGroup}
                      groupData={currentGroupData}
                    />

                    {/* Members */}
                    <GroupMembersList
                      activeTab={activeTab}
                      members={filteredMembers}
                      authUserId={authUserId}
                      isAdmin={isAdmin}
                      admins={currentGroupData?.admins || []}
                      isRemovingMember={isRemovingMember}
                      isMakingAdmin={isMakingAdmin}
                      handleRemoveMember={handleRemoveMember}
                      handleMakeAdmin={handleMakeAdmin}
                      isAddingMembers={isAddingMembers}
                      onShowAddMembers={() => setShowAddMembers(true)} 
                    />
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