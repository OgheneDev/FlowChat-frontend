import { axiosInstance } from "@/api/axios";
import { create } from "zustand";

interface ContactState {
  contacts: any[];
  isLoading: boolean;
  getAllContacts: () => Promise<any[]>;
}

export const useContactStore = create<ContactState>((set) => ({
  contacts: [],
  isLoading: false,
  getAllContacts: async () => {
    set({ isLoading: true });
    try {
      const { data } = await axiosInstance.get("/messages/contacts");
      set({ contacts: data });
      return data;
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || "Error fetching contacts");
    } finally {
      set({ isLoading: false });
    }
  },
}));