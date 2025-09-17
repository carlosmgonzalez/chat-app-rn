import { BASE_URL } from "@/utlis/constants";
import { create } from "zustand";
import { useAuth } from "./auth-store";

export type User = {
  id: string;
  name: string;
  email: string;
};

// Reemplaza esto con la definición real de tu objeto de chat
export type Chat = {
  id: string;
  // ...otras propiedades del chat
};

interface ChatState {
  searchUser: (email: string) => Promise<User>;
  createNewChat: (receiver_user_email: string) => Promise<Chat | undefined>;
}

export const useChat = create<ChatState>()((set, get) => ({
  searchUser: async (email) => {
    try {
      const response = await fetch(`${BASE_URL}/users?email=${email}`);

      if (!response.ok && response.status === 404) {
        throw new Error("User not found");
      }

      const user = (await response.json()) as User;

      return user;
    } catch (error) {
      console.error("Error searching user:", error);
      throw error; // Relanza el error para que sea manejado por quien llama
    }
  },
  createNewChat: async (receiver_user_email: string) => {
    try {
      // Accede a fetchWithAuth usando getState()
      const { fetchWithAuth } = useAuth.getState();
      const response = await fetchWithAuth(`${BASE_URL}/chat/new`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          receiver_user_email,
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
      throw error; // Relanza el error para que sea manejado por quien llama
    }
  },
}));
