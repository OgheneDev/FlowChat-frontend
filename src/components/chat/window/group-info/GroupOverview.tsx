import React from 'react'
import { Loader2, Edit2, Trash2, LogOut } from 'lucide-react'
import { motion } from 'framer-motion'

interface Props {
  activeTab: string
  setActiveTab: (t: 'overview'|'members') => void
  isEditing: boolean
  setIsEditing: (b: boolean) => void
  editForm: { name: string; description: string }
  setEditForm: (f: any) => void
  handleSave: () => Promise<void>
  handleCancelEdit: () => void
  isSavingGroup: boolean
  isAdmin: boolean
  handleDelete: () => Promise<void>
  isDeletingGroup: boolean
  handleLeave: () => Promise<void>
  isLeavingGroup: boolean
  groupData: any
}

const GroupOverview: React.FC<Props> = ({
  activeTab, setActiveTab, isEditing, setIsEditing, editForm, setEditForm,
  handleSave, handleCancelEdit, isSavingGroup, isAdmin, handleDelete, isDeletingGroup, handleLeave, isLeavingGroup, groupData
}) => {
  return (
    <>
      <div className="sticky top-0 bg-[#111111] z-10 border-b border-[#2a2a2a]">
        <div className="flex">
          {['overview', 'members'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex-1 py-3 text-sm cursor-pointer font-medium capitalize transition-colors relative ${activeTab === tab ? 'text-[#00d9ff]' : 'text-[#999] hover:text-white'}`}>
              {tab === 'members' ? `Members (${groupData.members?.length})` : 'Overview'}
              {activeTab === tab && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00d9ff]" />}
            </button>
          ))}
        </div>
      </div>

      {/* Only show content for the active tab */}
      {activeTab === 'overview' && (
        <div className="space-y-5 mt-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[#999]">Description</span>
              {isAdmin && !isEditing && <button onClick={() => setIsEditing(true)} className="text-xs text-[#00d9ff] flex items-center gap-1 cursor-pointer"><Edit2 className="w-3 h-3" /> Edit</button>}
            </div>

            {isEditing ? (
              <textarea value={editForm.description} onChange={(e)=> setEditForm({...editForm, description: e.target.value})} className="w-full p-3 bg-[#1e1e1e] rounded-lg text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#00d9ff]" rows={3} placeholder="Add a description"/>
            ) : (
              <p className="text-[#ccc] text-sm leading-relaxed">{groupData.description || 'No description added.'}</p>
            )}
          </div>

          {isEditing && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2">
              <button onClick={handleCancelEdit} disabled={isSavingGroup} className="flex-1 py-2 text-sm cursor-pointer text-[#999] hover:text-white disabled:opacity-50">Cancel</button>
              <button onClick={handleSave} disabled={isSavingGroup} className="flex-1 py-2 cursor-pointer bg-[#00d9ff] text-white rounded-lg text-sm font-medium hover:bg-[#00b8d4] disabled:opacity-50 flex items-center justify-center gap-2">
                {isSavingGroup ? <><Loader2 className="animate-spin h-4 w-4" /> Saving...</> : 'Save'}
              </button>
            </motion.div>
          )}

          <div className="h-px bg-[#2a2a2a]" />

          {/* Delete/Leave Group Buttons - Only on Overview tab */}
          <div className="space-y-1">
            {isAdmin ? (
              <button onClick={handleDelete} disabled={isDeletingGroup} className="w-full flex cursor-pointer items-center text-sm justify-center gap-3 p-3 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50">
                {isDeletingGroup ? <><Loader2 className='w-4 h-4 animate-spin'/> Deleting...</> : <><Trash2 className='h-4 w-4'/> Delete Group</>}
              </button>
            ) : (
              <button onClick={handleLeave} disabled={isLeavingGroup} className="w-full cursor-pointer flex items-center justify-center text-sm gap-3 p-3 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50">
                {isLeavingGroup ? <><Loader2 className='h-4 w-4 animate-spin'/> Leaving...</> : <><LogOut className="w-5 h-5"/> Leave Group</>}
              </button>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default GroupOverview