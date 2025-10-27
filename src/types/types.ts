
export interface sendMessageData {
    text?: string;
    image?: string;
    replyTo?: string;
    isForwarded?: boolean;
}

export interface Message {
    _id: string
    text: string
    senderId: string
    senderName?: string
    createdAt: string
    status: 'sent' | 'delivered' | 'read'
    image?: string | null
    replyTo?: string
}

export interface PrivateMessage extends Message {
    receiver: string
}

export interface GroupMessage extends Message {
    groupId: string
}
