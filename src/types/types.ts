
export interface sendMessageData {
    text?: string;
    image?: string;
    replyTo?: string;
    isForwarded?: boolean;
}

export interface User {
  _id: string;
  fullName: string;
  profilePic?: string;
  email: string;
  online?: boolean;
}

export interface Message {
  _id: string;
  text?: string;
  image?: string | null;
  senderId: User | string; 
  receiverId?: string;
  groupId?: string;
  status: "sent" | "delivered" | "seen";
  replyTo?: Message | string;
  createdAt: string;
  isDeleted?: boolean;
  deleted?: boolean;
  deletedForEveryone?: boolean;
  editedAt?: string;
  senderName?: string
}

export interface PrivateMessage extends Message {
    receiver: string
}

export interface GroupMessage extends Message {
    groupId: string
}

export interface GroupWithPinned {
  _id: string;
  name: string;
  members: User[];
  admins: User[] | string[];
  groupImage?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  lastMessage?: Message | null;
  pinnedMessages?: string[];
  unreadCount?: number;
}

export interface DeleteMessageData {
  messageId: string;
  deleteType: "everyone" | "me";
}

export interface EditMessageData {
  text: string;
}

export interface CreateGroupData {
  name: string;
  members: string[];
  groupImage?: string;
  description: string;
}

export interface UpdateGroupData {
  name?: string;
  newImage?: string;
  members?: string[];
  description?: string;
}

export interface BaseGroupEvent {
  type: "admin_promoted" | "member_joined" | "member_left" | "member_removed" | "group_created" | "group_updated";
  userId?: string;
  userName?: string;
  targetUserId?: string;
  targetUserName?: string;
  groupId: string;
}

export interface GroupEventMessage extends BaseGroupEvent {
  _id: string;
  createdAt: string;
  isEvent: true;
}

export interface ChatWithPinned {
  _id: string;
  participants: string[];
  participantDetails?: Array<{
    _id: string;
    fullName: string;
    profilePic?: string;
  }>;
  pinnedMessages: string[];
  fullName?: string;
  profilePic?: string;
  lastMessage?: Message;
  updatedAt?: string;
  unreadCount?: number;
}

export interface PasswordChecks {
  minLength: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
  hasUpper: boolean;
  hasLower: boolean;
}