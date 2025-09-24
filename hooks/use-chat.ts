import { useCallback } from "react";
import {
  createNewChat as createNewChatService,
  searchUser as searchUserService,
  getChat as getChatService,
  fetchChats,
  fetchChatBetweenUsers,
} from "@/services/chat-service";

export const useChat = () => {
  const searchUser = useCallback(async (email: string) => {
    return searchUserService(email);
  }, []);

  const createNewChat = useCallback(
    async (receiver_user_id: string, message: string) => {
      return createNewChatService(receiver_user_id, message);
    },
    [],
  );

  const getChat = useCallback(async (chatId: string) => {
    return getChatService(chatId);
  }, []);

  const getChatBetweenUsers = useCallback(async (userId: string) => {
    return fetchChatBetweenUsers(userId);
  }, []);

  const getChats = useCallback(async () => {
    return fetchChats();
  }, []);

  return {
    createNewChat,
    searchUser,
    getChat,
    getChats,
    getChatBetweenUsers,
  };
};
