import React from 'react'
import { ArrowLeft, Loader2 } from 'lucide-react'

interface Props {
  showAddMembers: boolean
  onBack: () => void
  onClose: () => void
  onAdd: () => void
  isAdding?: boolean
}

const GroupInfoHeader: React.FC<Props> = ({ showAddMembers, onBack, onClose, onAdd, isAdding }) => {
  return (
    <div className="flex items-center justify-between p-3 bg-[#1e1e1e] border-b border-[#2a2a2a]">
      {showAddMembers ? (
        <>
          <button onClick={onBack} className="p-2 cursor-pointer rounded-full hover:bg-[#2a2a2a] transition-colors">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h2 className="text-lg font-medium text-white">Add Members</h2>
          <button onClick={onAdd} disabled={isAdding} className="p-2 text-[#00d9ff] text-sm disabled:text-[#666] disabled:cursor-not-allowed">
            {isAdding ? <Loader2 className="animate-spin h-4 w-4" /> : 'Add'}
          </button>
        </>
      ) : (
        <>
          <button onClick={onClose} className="p-2 cursor-pointer rounded-full hover:bg-[#2a2a2a] transition-colors">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h2 className="text-lg font-medium text-white">Group Info</h2>
          <div className="w-9" />
        </>
      )}
    </div>
  )
}

export default GroupInfoHeader
