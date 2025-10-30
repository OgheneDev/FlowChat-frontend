import { Check, CheckCheck } from "lucide-react"

export const MessageStatus = ({ status }: { status?: 'sent' | 'delivered' | 'seen' }) => {
  if (!status) return null
  if (status === 'sent') return <Check className="w-3 h-3 text-[#999999]" />
  if (status === 'delivered') return <CheckCheck className="w-3 h-3 text-[#999999]" />
  if (status === 'seen') return <CheckCheck className="w-3 h-3 text-[#00d9ff]" />
  return null
}