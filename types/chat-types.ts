import type {
  QuickReplies,
  User as GiftedUser,
} from "react-native-gifted-chat";
import type { User } from "./user-types";

export interface Message {
  _id: string | number;
  text: string;
  createdAt: Date | number;
  user: GiftedUser;
  image?: string;
  video?: string;
  audio?: string;
  system?: boolean;
  sent?: boolean;
  received?: boolean;
  pending?: boolean;
  quickReplies?: QuickReplies;
}

export interface Chat {
  id: string;
  type: string;
  name: string;
  created_at: Date;
  users: User[];
  messages: ChatMessage[];
}

export interface ChatMessage {
  id: string;
  content: string;
  sent_at: Date;
  sender: User;
}

export interface UserChats {
  id: string;
  created_at: Date;
  users: User[];
}
