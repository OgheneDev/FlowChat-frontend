import { useAuthStore } from "../auth";

/**
 * Normalize the selectedUser value into an id string (handles string or object shapes).
 */
export const normalizeSelectedUserId = (selectedUser: any): string | null => {
	// ...handles string or object shapes used across UI/store
	if (!selectedUser) return null;
	if (typeof selectedUser === "string") return selectedUser;
	return selectedUser._id || selectedUser.chatPartnerId || selectedUser.groupId || null;
};

/**
 * Increment unreadCounts and update the matching chat item in one place.
 * Accepts Zustand set/get so it can be used from socket handlers or store code.
 */
export const bumpUnreadForPartner = (set: any, get: any, partnerId: string) => {
	const currentUserId = useAuthStore.getState().authUser?._id || null;
	set((state: any) => ({
		unreadCounts: {
			...state.unreadCounts,
			[partnerId]: (state.unreadCounts[partnerId] || 0) + 1,
		},
		chats: state.chats.map((chat: any) => {
			const chatPartnerId = chat.participants?.find((p: string) => p !== currentUserId) || chat._id;
			if (chatPartnerId === partnerId) {
				return { ...chat, unreadCount: (chat.unreadCount || 0) + 1 };
			}
			return chat;
		}),
	}));
};
