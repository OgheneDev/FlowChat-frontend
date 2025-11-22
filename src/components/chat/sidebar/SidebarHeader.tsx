import React from 'react'
import { User, Camera, Settings, LogOut, SquarePen } from 'lucide-react'
import Image from 'next/image'

interface Props {
  authUser?: any
  isUpdating?: boolean
  fileInputRef: React.RefObject<HTMLInputElement | null>
  getprofilePic: () => string | null | undefined
  onImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onOpenSettings: () => void
  onLogout: () => void
  onCreateGroup: () => void
}

const SidebarHeader: React.FC<Props> = ({
  isUpdating, 
  fileInputRef,
  getprofilePic,
  onImageChange,
  onOpenSettings,
  onLogout,
  onCreateGroup,
}) => {
  return (
    <header className="flex items-center justify-between p-5 border-b border-[#2a2a2a]">
      <div className="relative group">
        <button
          onClick={() => !isUpdating && fileInputRef.current?.click()}
          disabled={isUpdating}
          className="size-14 rounded-full cursor-pointer overflow-hidden ring-2 ring-transparent focus:ring-[#00d9ff] transition-all duration-200"
          aria-label="Change profile picture"
        >
          {isUpdating ? (
            <div className="size-full bg-[#1e1e1e] flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#00d9ff] border-t-transparent"></div>
            </div>
          ) : getprofilePic() ? (
            <Image src={getprofilePic()!} width={50} height={50} alt="Profile" className="size-full object-cover" />
          ) : (
            <div className="size-full bg-[#1e1e1e] flex items-center justify-center">
              <User className="w-8 h-8 text-[#999999]" />
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
          onChange={onImageChange}
          className="hidden"
          disabled={isUpdating}
        />
      </div>

      <div className="flex gap-1.5">
        {[ 
          { Icon: Settings, label: "Settings", onClick: onOpenSettings },
          { Icon: LogOut, label: "Logout", onClick: onLogout },
          { Icon: SquarePen, label: "Create Group", onClick: onCreateGroup }
        ].map(({ Icon, label, onClick }) => (
          <button
            key={label}
            onClick={onClick}
            aria-label={label}
            title={label}
            className="p-2 rounded-lg cursor-pointer hover:bg-[#1e1e1e] transition-all duration-200 group"
          >
            <Icon className="w-5 h-5 text-[#999999] group-hover:text-white transition-colors" />
          </button>
        ))}
      </div>
    </header>
  )
}

export default SidebarHeader
