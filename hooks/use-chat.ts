import { useCallback } from "react";
import {
  createNewChat as createNewChatService,
  searchUser as searchUserService,
  getChat as getChatService,
  getUserChats as getUserChatsService,
} from "@/services/chat-service";

export const useChat = () => {
  const searchUser = useCallback(async (email: string) => {
    return searchUserService(email);
  }, []);

  const createNewChat = useCallback(async (receiver_user_email: string) => {
    return createNewChatService(receiver_user_email);
  }, []);

  const getChat = useCallback(async (chatId: string) => {
    return getChatService(chatId);
  }, []);

  const getUserChats = useCallback(async () => {
    return getUserChatsService();
  }, []);

  return {
    createNewChat,
    searchUser,
    getChat,
    getUserChats,
  };
};
