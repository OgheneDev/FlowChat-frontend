import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, Trash2 } from 'lucide-react'

interface Props {
  isOpen: boolean
  onClose: () => void
  deletePassword: string
  setDeletePassword: (s: string) => void
  deleteError: string
  handleDeleteAccount: () => Promise<void>
  isDeleting?: boolean
}

const DeleteAccountModal: React.FC<Props> = ({ isOpen, onClose, deletePassword, setDeletePassword, deleteError, handleDeleteAccount, isDeleting }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center p-4" onClick={onClose}>
          <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} onClick={(e)=>e.stopPropagation()} className="bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-6 max-w-md w-full border-2 border-red-500/30 shadow-2xl shadow-red-500/10">
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 bg-red-500/10 rounded-xl"><AlertCircle className="w-6 h-6 text-red-400"/></div>
              <h3 className="text-xl font-bold text-white">Delete Account?</h3>
            </div>

            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 mb-5">
              <p className="text-sm text-white/90 leading-relaxed">This action <strong className="text-red-400">cannot be undone</strong>. All your data, messages, and account information will be <strong>permanently deleted</strong>.</p>
            </div>

            <div className="space-y-3">
              <label className="text-xs text-[#999999] uppercase tracking-wider">Confirm with your password</label>
              <input type="password" value={deletePassword} onChange={(e)=>setDeletePassword(e.target.value)} placeholder="Enter your password" className="w-full px-4 py-3 bg-[#0f0f0f] border-2 border-[#2a2a2a] rounded-xl text-white placeholder-[#666666] text-sm focus:outline-none focus:border-red-500" autoFocus />
              {deleteError && <p className="text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">{deleteError}</p>}
            </div>

            <div className="flex gap-3 mt-6">
              <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={onClose} className="flex-1 px-4 py-2.5 text-sm cursor-pointer bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-xl">Cancel</motion.button>
              <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={handleDeleteAccount} disabled={isDeleting || !deletePassword} className="flex-1 px-4  cursor-pointer text-sm py-2.5 bg-red-600 text-white rounded-xl disabled:opacity-50 flex items-center justify-center gap-2">
                {isDeleting ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Deleting...</> : <><Trash2 className="w-4 h-4" />Delete Forever</>}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default DeleteAccountModal
