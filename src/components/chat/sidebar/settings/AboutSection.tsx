import React from 'react'
import { motion } from 'framer-motion'
import { Edit2, XCircle, Check } from 'lucide-react'

interface Props {
  about: string
  setAbout: (s: string) => void
  isEditing: boolean
  setIsEditing: (b: boolean) => void
  handleSaveAbout: () => Promise<void>
  handleCancelEdit: () => void
  isUpdating?: boolean
  originalAbout?: string
}

const AboutSection: React.FC<Props> = ({ about, setAbout, isEditing, setIsEditing, handleSaveAbout, handleCancelEdit, isUpdating, originalAbout }) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs text-[#999999] uppercase tracking-wider flex items-center gap-2"><div className="w-1 h-4 bg-[#00d9ff] rounded-full" />About Me</label>
        {!isEditing && <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.95}} onClick={()=>setIsEditing(true)} className="text-[#00d9ff] text-sm font-medium cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-[#00d9ff]/10"><Edit2 className="w-3.5 h-3.5" /> Edit</motion.button>}
      </div>

      {isEditing ? (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <div className="relative">
            <textarea value={about} onChange={(e)=>setAbout(e.target.value)} placeholder="Tell us about yourself..." rows={4} maxLength={160} className="w-full px-4 py-3 bg-[#0f0f0f] border-2 border-[#2a2a2a] rounded-xl text-white placeholder-[#666666] text-sm focus:outline-none focus:border-[#00d9ff] resize-none" autoFocus />
            <div className="absolute bottom-3 right-3 text-xs"><span className={`font-medium ${about.length > 150 ? 'text-red-400' : about.length > 140 ? 'text-yellow-400' : 'text-[#666666]'}`}>{about.length}/160</span></div>
          </div>

          <div className="flex gap-2">
            <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={handleCancelEdit} className="flex-1 py-2 text-sm text-[#999] hover:text-white">Cancel</motion.button>
            <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={handleSaveAbout} disabled={isUpdating} className="flex-1 py-2 bg-[#00d9ff] text-black rounded-lg text-sm font-medium hover:bg-[#00b8d4] disabled:opacity-50 flex items-center justify-center gap-2">{isUpdating ? 'Saving...' : 'Save'}</motion.button>
          </div>
        </motion.div>
      ) : (
        <div className="bg-[#1a1a1a] rounded-xl p-4 border border-[#2a2a2a] min-h-[5rem]">
          <p className="text-white/90 text-sm leading-relaxed">{originalAbout || <span className="text-[#666666] italic flex items-center gap-2"><Edit2 className="w-4 h-4" />No bio yet. Click edit to add one.</span>}</p>
        </div>
      )}
    </div>
  )
}

export default AboutSection
