import { create } from "zustand";
import { fetchChats } from "@/services/chat-service";
import { UserChats } from "@/types/chat-types";

interface ChatState {
  userChats: UserChats[];
  isLoading: boolean;
  error: string | null;
  fetchUserChats: () => Promise<void>;
  cleanUserChat: () => void;
}

export const useChatStore = create<ChatState>()((set) => {
  return {
    userChats: [],
    isLoading: false,
    error: null,
    fetchUserChats: async () => {
      set({ isLoading: true, error: null });
      try {
        const chats = await fetchChats();
        set({ userChats: chats, isLoading: false });
      } catch (error) {
        set({ isLoading: false, error: "Failed to fetch user chats" });
        console.error(error);
      }
    },
    cleanUserChat: () => set({ userChats: [] }),
  };
});
