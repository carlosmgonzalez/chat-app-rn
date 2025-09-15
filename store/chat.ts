import { BASE_URL } from "@/utlis/constants";
import { create } from "zustand";

export type User = {
  id: string;
  name: string;
  email: string;
};

interface ChatState {
  searchUser: (email: string) => Promise<User>;
}

export const useChat = create<ChatState>()((set) => ({
  searchUser: async (email) => {
    try {
      const response = await fetch(`${BASE_URL}/users?email=${email}`);

      if (!response.ok && response.status === 404) {
        throw new Error("User not found");
      }

      const user = (await response.json()) as User;

      return user;
    } catch (error) {
      console.log(error);
      throw new Error((error as any).message);
    }
  },
}));
