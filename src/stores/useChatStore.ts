import { create } from "zustand";
import { axiosInstance } from "@/api/axios";
import { sendMessageData } from "@/types/types";

export const useChatStore = create((set) => ({
    contacts: [],
    chats: [],
    privateMessages: [],
    groups: [],
    groupMessages: [],
    activeTab: "chats",
    selectedUser: null,
    isLoading: false,
    isMessagesLoading: false,
    isSendingMessage: false,

    setActiveTab: (tab: string) => set({activeTab: tab}),
    setSelectedUser: (selectedUser: string) => set({selectedUser}),

    getAllContacts: async () => {
        set({isLoading: true});
        try {
           const response = await axiosInstance.get("/messages/contacts");
           set({contacts: response.data});
           return response.data;
        } catch (error: any) {
            const errorMessage = error?.response?.data?.message || "Error fetching contacts";
            throw new Error(errorMessage);
        } finally {
            set({isLoading: false})
        }
    },

    getChatPartners: async () => {
        set({isLoading: true})
        try {
            const response = await axiosInstance.get("/messages/chats");
            console.log("Chat Partners: ", response)
            set({chats: response.data});
            return response.data
        } catch (error: any) {
            const errorMessage = error?.response?.data?.message || "Error fetching chats";
            throw new Error(errorMessage);
        } finally {
            set({isLoading: false})
        }
    },

    getMyGroups: async () => {
        set({isLoading: true})
        try {
            const response = await axiosInstance.get("/groups/my-groups");
            set({groups: response.data});
            return response.data
        } catch (error: any) {
            const errorMessage = error?.response?.data?.message || "Error fetching groups";
            throw new Error(errorMessage);
        } finally {
            set({isLoading: false})
        }
    },

    getPrivateMessages: async (id: string) => {
        set({isMessagesLoading: true});
        try {
            const response = await axiosInstance.get(`/messages/${id}`);
            set({privateMessages: response.data});
            return response.data;
        } catch (error: any) {
            throw new Error(error?.response?.data?.message || "Error fetching messages");
        } finally {
            set({isMessagesLoading: false});
        }
    },

    getGroupMessages: async (groupId: string) => {
        set({isMessagesLoading: true});
        try {
            const response = await axiosInstance.get(`/groups/${groupId}/messages`);
            set({groupMessages: response.data});
            return response.data;
        } catch (error: any) {
            throw new Error(error?.response?.data?.message || "Error fetching group messages");
        } finally {
            set({isMessagesLoading: false});
        }
    },

    sendPrivateMessage: async (id: string, data: sendMessageData) => {
        set({isSendingMessage: true})
        try {
            const response = await axiosInstance.post(`/messages/send/${id}`, data);
            return response.data
        } catch (error: any) {
            const errorMessage = error?.response?.data?.message || "Error sending message";
            throw new Error(errorMessage);
        }
    },

    sendGroupMessage: async (groupId: string, data: sendMessageData) => {
        set({isSendingMessage: true})
        try {
            const response = await axiosInstance.post(`/groups/${groupId}/messages`, data);
            return response.data
        } catch (error: any) {
            const errorMessage = error?.response?.data?.message || "Error sending message to group";
            throw new Error(errorMessage);
        } finally {
            set({isSendingMessage: false})
        }
    },

}));