import { useAuthStore } from "../auth";

/**
 * Normalize the selectedUser value into an id string (handles string or object shapes).
 */
export const normalizeSelectedUserId = (selectedUser: any): string | null => {
	// handles string or object shapes used across UI/store
	if (!selectedUser) return null;
	if (typeof selectedUser === "string") return selectedUser;
	return selectedUser._id || selectedUser.groupId || selectedUser.chatPartnerId || null;
};

/**
 * Increment unreadCounts and update the matching group item in one place.
 * Accepts Zustand set so it can be used from socket handlers or store code.
 */
export const bumpUnreadForGroup = (set: any, groupId: string) => {
	const currentUserId = useAuthStore.getState().authUser?._id || null;
	set((state: any) => ({
		unreadCounts: {
			...state.unreadCounts,
			[groupId]: (state.unreadCounts[groupId] || 0) + 1,
		},
		groups: state.groups.map((g: any) =>
			g._id === groupId ? { ...g, unreadCount: (g.unreadCount || 0) + 1 } : g
		),
	}));
};
