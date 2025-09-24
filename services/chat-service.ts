import { useAuthStore } from "@/store/auth-store";
import { Chat, UserChats } from "@/types/chat-types";
import { User } from "@/types/user-types";
import { BASE_URL } from "@/utlis/constants";

export const searchUser = async (email: string) => {
  try {
    const response = await fetch(`${BASE_URL}/users?email=${email}`);

    if (!response.ok && response.status === 404) {
      throw new Error("User not found");
    }

    const user = (await response.json()) as User;

    return user;
  } catch (error) {
    console.error("Error searching user:", error);
    throw error;
  }
};

export const createNewChat = async (
  receiver_user_id: string,
  message: string,
) => {
  try {
    const { fetchWithAuth } = useAuthStore.getState();
    const response = await fetchWithAuth(`${BASE_URL}/chat/new`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        receiver_user_id,
        message,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Failed to create new chat: ${response.status} ${errorBody}`,
      );
    }

    const chat = (await response.json()) as Chat;

    return chat;
  } catch (error) {
    console.error("Error creating new chat:", error);
    throw error;
  }
};

export const getChat = async (chatId: string) => {
  try {
    const { fetchWithAuth } = useAuthStore.getState();
    const response = await fetchWithAuth(`${BASE_URL}/chat/${chatId}`, {});

    if (!response.ok) {
      const errorBody = await response.json();
      throw new Error(
        `Failed to get chat history: ${response.status} ${errorBody.detail}`,
      );
    }

    const chat = (await response.json()) as Chat;

    return chat.messages
      .map((message) => ({
        _id: message.id,
        createdAt: new Date(message.sent_at),
        text: message.content,
        user: {
          _id: String(message.sender.id),
          name: message.sender.name,
        },
      }))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } catch (error) {
    console.error(`Error fetching chat ${chatId}:`, error);
    throw error;
  }
};

export const fetchChats = async () => {
  // Get some information of all chat that the user have
  try {
    const { fetchWithAuth } = useAuthStore.getState();
    const response = await fetchWithAuth(`${BASE_URL}/chat/`, {});

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Failed to get chats: ${response.status} ${errorBody}`);
    }

    const chats = (await response.json()) as UserChats[];

    return chats;
  } catch (error) {
    console.error(`Error fetching chats:`, error);
    throw error;
  }
};

export const fetchChatBetweenUsers = async (receiver_user_id: string) => {
  try {
    const { fetchWithAuth } = useAuthStore.getState();
    const response = await fetchWithAuth(
      `${BASE_URL}/chat/user/${receiver_user_id}`,
      {},
    );

    const chat: Chat | null = await response.json();

    return chat;
  } catch (error) {
    console.log(error);
  }
};
