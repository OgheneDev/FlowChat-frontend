import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, Edit2, Check, AlertCircle, Eye, EyeOff, CheckCircle2 } from 'lucide-react'

interface PasswordChecks {
  minLength: boolean
  hasNumber: boolean
  hasSpecial: boolean
  hasUpper: boolean
  hasLower: boolean
}

interface Props {
  showChangePassword: boolean
  setShowChangePassword: (b: boolean) => void
  changePasswordData: { currentPassword: string; newPassword: string; confirmPassword: string }
  setChangePasswordData: (d: any) => void
  changePasswordError: string
  setChangePasswordError: (s: string) => void
  showPasswords: { current: boolean; new: boolean; confirm: boolean }
  togglePasswordVisibility: (field: 'current'|'new'|'confirm') => void
  passwordChecks: PasswordChecks
  validatePassword: (pass: string) => void
  isChangingPassword: boolean
  handleChangePassword: () => Promise<void>
  getPasswordStrength: () => number
  getStrengthColor: () => string
  getStrengthLabel: () => string
}

const PasswordCheckItem = ({ checked, label }: { checked: boolean; label: string }) => (
  <div className="flex items-center gap-2 transition-all duration-200">
    <div className={`flex items-center justify-center w-4 h-4 rounded-full transition-all duration-300 ${checked ? 'bg-cyan-400/20' : 'bg-transparent border border-gray-600'}`}>
      {checked && <CheckCircle2 className="h-3 w-3 text-cyan-400" />}
    </div>
    <span className={`text-xs transition-colors duration-200 ${checked ? 'text-cyan-400' : 'text-gray-500'}`}>{label}</span>
  </div>
)

const SecuritySection: React.FC<Props> = (props) => {
  const {
    showChangePassword, setShowChangePassword, changePasswordData, setChangePasswordData,
    changePasswordError, setChangePasswordError, showPasswords, togglePasswordVisibility,
    passwordChecks, validatePassword, isChangingPassword, handleChangePassword,
    getPasswordStrength, getStrengthColor, getStrengthLabel
  } = props

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs cursor-pointer text-[#999999] uppercase tracking-wider flex items-center gap-2"><div className="w-1 h-4 bg-[#00d9ff] rounded-full" />Security</label>
        </div>

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => setShowChangePassword(true)}
          className="w-full bg-[#1a1a1a] rounded-2xl p-4 border border-[#2a2a2a] hover:border-[#00d9ff]/30 transition-colors duration-300 text-left cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#00d9ff]/10 rounded-xl">
                <Lock className="w-4 h-4 text-[#00d9ff]" />
              </div>
              <div>
                <h4 className="text-white text-sm font-medium">Change Password</h4>
                <p className="text-[#999999] text-xs">Update your account password</p>
              </div>
            </div>
            <div className="p-2 rounded-xl bg-white/5 group-hover:bg-[#00d9ff]/10 transition-colors">
              <Edit2 className="w-4 h-4 text-[#999999] group-hover:text-[#00d9ff]" />
            </div>
          </div>
        </motion.button>
      </div>

      <AnimatePresence>
        {showChangePassword && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center p-4" onClick={() => setShowChangePassword(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} onClick={(e)=>e.stopPropagation()} className="bg-gradient-to-b from-[#1a1a1a] overflow-y-auto to-[#0f0f0f] md:h-[500px] rounded-2xl p-6 max-w-md w-full border-2 border-[#00d9ff]/30 shadow-2xl shadow-[#00d9ff]/10">
              <div className="flex items-start gap-3 mb-6">
                <div className="p-2 bg-[#00d9ff]/10 rounded-xl">
                  <Lock className="w-6 h-6 text-[#00d9ff]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Change Password</h3>
                  <p className="text-sm text-[#999999] mt-1">Update your account password</p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Current Password */}
                <div>
                  <label className="text-xs text-[#999999] uppercase tracking-wider block mb-2">Current Password</label>
                  <div className="relative group">
                    <input type={showPasswords.current ? "text":"password"} value={changePasswordData.currentPassword} onChange={(e)=>{ setChangePasswordData(prev=>({...prev, currentPassword:e.target.value})); setChangePasswordError('') }} placeholder="Enter current password" className="w-full px-4 py-3 bg-[#0f0f0f] border-2 border-[#2a2a2a] rounded-xl text-white placeholder-[#666666] text-sm focus:outline-none focus:border-[#00d9ff] transition-colors pr-12" autoFocus />
                    <button type="button" onClick={()=>togglePasswordVisibility('current')} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#666666] hover:text-white transition-colors">{ showPasswords.current ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/> }</button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="text-xs text-[#999999] uppercase tracking-wider block mb-2">New Password</label>
                  <div className="relative group">
                    <input type={showPasswords.new ? "text":"password"} value={changePasswordData.newPassword} onChange={(e)=>{ setChangePasswordData(prev=>({...prev, newPassword:e.target.value})); validatePassword(e.target.value); setChangePasswordError('') }} placeholder="Enter new password (min. 8 characters)" className="w-full px-4 py-3 bg-[#0f0f0f] border-2 border-[#2a2a2a] rounded-xl text-white placeholder-[#666666] text-sm focus:outline-none focus:border-[#00d9ff] transition-colors pr-12" />
                    <button type="button" onClick={()=>togglePasswordVisibility('new')} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#666666] hover:text-white transition-colors">{ showPasswords.new ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/> }</button>
                  </div>

                  {changePasswordData.newPassword && (
                    <div className="space-y-2 mt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Password Strength</span>
                        <span className="text-xs font-medium" style={{ color: getStrengthColor() }}>{ getStrengthLabel() }</span>
                      </div>
                      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full transition-all duration-500 rounded-full" style={{ width: `${(getPasswordStrength() / 5) * 100}%`, backgroundColor: getStrengthColor() }} />
                      </div>
                    </div>
                  )}

                  {changePasswordData.newPassword && (
                    <div className="mt-3 p-4 rounded-xl bg-black/40 border border-gray-800 space-y-2.5">
                      <PasswordCheckItem checked={passwordChecks.minLength} label="At least 8 characters" />
                      <PasswordCheckItem checked={passwordChecks.hasUpper} label="One uppercase letter" />
                      <PasswordCheckItem checked={passwordChecks.hasLower} label="One lowercase letter" />
                      <PasswordCheckItem checked={passwordChecks.hasNumber} label="One number" />
                      <PasswordCheckItem checked={passwordChecks.hasSpecial} label="One special character (!@#$%^&*)" />
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="text-xs text-[#999999] uppercase tracking-wider block mb-2">Confirm New Password</label>
                  <div className="relative group">
                    <input type={showPasswords.confirm ? "text":"password"} value={changePasswordData.confirmPassword} onChange={(e)=>{ setChangePasswordData(prev=>({...prev, confirmPassword:e.target.value})); setChangePasswordError('') }} placeholder="Confirm new password" className="w-full px-4 py-3 bg-[#0f0f0f] border-2 border-[#2a2a2a] rounded-xl text-white placeholder-[#666666] text-sm focus:outline-none focus:border-[#00d9ff] transition-colors pr-12" />
                    <button type="button" onClick={()=>togglePasswordVisibility('confirm')} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#666666] hover:text-white transition-colors">{ showPasswords.confirm ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/> }</button>
                  </div>
                </div>

                {/* Error */}
                {changePasswordError && <p className="text-xs text-red-400 flex items-center gap-1.5 bg-red-500/10 px-3 py-2 rounded-lg"><AlertCircle className="w-3.5 h-3.5" />{changePasswordError}</p>}
              </div>

              <div className="flex gap-3 mt-6">
                <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={()=>setShowChangePassword(false)} className="flex-1 px-4 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-xl hover:bg-[#252525]">Cancel</motion.button>
                <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={handleChangePassword} disabled={isChangingPassword || Object.values(passwordChecks).some(v=>!v)} className="flex-1 px-4 py-2.5 bg-[#00d9ff] text-black rounded-xl hover:bg-[#00c0e0] disabled:opacity-50 flex items-center justify-center gap-2">
                  {isChangingPassword ? <><div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />Changing...</> : <><Check className="w-4 h-4" />Change Password</>}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default SecuritySection
