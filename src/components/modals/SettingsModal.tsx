import React from 'react'
import { motion, AnimatePresence } from 'framer-motion';
import { useToastStore } from '@/stores';
import { X } from 'lucide-react';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void
}

const SettingsModal: React.FC<SettingsModalProps> = ({isOpen, onClose}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div>
            {/* Backdrop */}
            <motion.div
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             onClick={onClose}
             className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            >

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
                          onClick={onClose}
                          className="p-2 rounded-full cursor-pointer hover:bg-[#2a2a2a] transition-colors"
                        >
                          <X className="w-5 h-5 text-white" />
                        </button>
                        <h2 className="text-lg font-medium text-white">Settings</h2>
                        <div className="w-9" />
                    </div>

                    {/* Scrollable Content */}
                    <div className='flex-1 overflow-y-auto px-5 py-5 space-y-5'>
                        {/* Profile Image */}
                        
                    </div>
                </motion.div>

            </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default SettingsModal
