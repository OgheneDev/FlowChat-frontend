
export interface sendMessageData {
    text?: string;
    image?: string;
    replyTo?: string;
    isForwarded?: boolean;
}

interface User {
    _id: string
    fullName: string
    profilePic?: string
}

export interface Message {
    _id: string
    text: string
    senderId: User
    receiverId: User
    senderName?: string
    createdAt: string
    status: 'sent' | 'delivered' | 'seen'
    image?: string | null
    replyTo?: string
}

export interface PrivateMessage extends Message {
    receiver: string
}

export interface GroupMessage extends Message {
    groupId: string
}
