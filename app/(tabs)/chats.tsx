import { useChat } from "@/hooks/use-chat";
import { useWebSocket } from "@/hooks/use-websocket";
import { getChat, getUserChats } from "@/services/chat-service";
import { useAuthStore } from "@/store/auth-store";
import { useChatStore } from "@/store/chat-store";
import { UserChats } from "@/types/chat-types";
import type { User } from "@/types/user-types";
import { router } from "expo-router";
import { ArrowRight, Search } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  Text,
  TextInput,
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from "react-native";

export default function Chat() {
  const { user } = useAuthStore();
  const { searchUser, createNewChat } = useChat();
  const { on } = useWebSocket(user!.id);

  const [userEmail, setUserEmail] = useState("");
  const [userFound, setUserFound] = useState<User | null>();

  const [userChats, setUserChats] = useState<UserChats[]>([]);

  useEffect(() => {
    const getChats = async () => {
      try {
        const chats = await getUserChats();
        setUserChats(chats);
      } catch (error) {
        console.error(error);
      }
    };

    getChats();
  }, []);

  useEffect(() => {
    const unsubscribeMessages = on("new_message", (data) => {
      setUserChats((prevChats) => {
        const existingChat = prevChats.find((chat) => chat.id === data.chat_id);

        if (existingChat) {
          // If chat exists, move it to the top of the list
          return [
            existingChat,
            ...prevChats.filter((chat) => chat.id !== data.chat_id),
          ];
        } else {
          // If it's a new chat, add it to the top.
          // NOTE: We're creating a new chat object from the message data.
          // This assumes the current user is the other participant.
          const newChat: UserChats = {
            id: data.chat_id,
            users: [
              data.sender,
              { id: user!.id, email: user!.email, name: user!.name },
            ],
            // Using the message's creation time for sorting.
            // You might want to fetch the full chat object for more accurate data.
            created_at: new Date(data.content.created_at),
          };
          return [newChat, ...prevChats];
        }
      });
    });

    return () => {
      unsubscribeMessages();
    };
  }, [on, user]);

  const handleSearchUser = async (email: string) => {
    const user = await searchUser(email);
    setUserFound(user);
  };

  return (
    <View style={{ flex: 1, marginHorizontal: 10 }}>
      <View
        style={{
          width: "100%",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
          marginTop: 10,
          marginBottom: 16,
        }}
      >
        <TextInput
          value={userEmail}
          onChangeText={setUserEmail}
          placeholder="User email"
          autoCapitalize="none"
          autoCorrect={false}
          placeholderTextColor="#ababab"
          style={styles.input}
        />
        <TouchableOpacity onPress={() => handleSearchUser(userEmail)}>
          <Search />
        </TouchableOpacity>
      </View>

      {userFound && (
        <TouchableOpacity
          onPress={async () => {
            const chat = await createNewChat(userFound.email);
            if (!chat) return;
            router.push({
              pathname: "/chat/[chatId]",
              params: {
                chatId: chat.id,
                userName: userFound.name,
              },
            });
          }}
          style={{
            backgroundColor: "rgba(230,230,230,1)",
            borderRadius: 8,
            marginVertical: 10,
            paddingVertical: 6,
            paddingHorizontal: 8,
            flexDirection: "row",
            width: "100%",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontWeight: "bold" }}>
              {userFound.name}
            </Text>
            <Text style={{ fontSize: 16 }}>{userFound.email}</Text>
          </View>
          <ArrowRight />
        </TouchableOpacity>
      )}
      {userChats ? (
        <FlatList
          data={userChats}
          keyExtractor={({ id }) => id}
          renderItem={({ item }) => {
            const receiverUser = item.users.find((u) => u.id !== user?.id);
            return (
              <TouchableOpacity
                onPress={async () => {
                  router.push({
                    pathname: "/chat/[chatId]",
                    params: {
                      chatId: item.id,
                      userName: receiverUser!.name,
                    },
                  });
                }}
                style={{
                  backgroundColor: "rgba(230,230,230,0.6)",
                  borderRadius: 8,
                  marginBottom: 10,
                  paddingVertical: 6,
                  paddingHorizontal: 8,
                  flexDirection: "row",
                  width: "100%",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                {receiverUser && (
                  <View style={{ flexDirection: "column" }}>
                    <Text style={{ fontSize: 18 }}>{receiverUser.name}</Text>
                    <Text style={{ fontSize: 16, color: "#757575" }}>
                      {receiverUser.email}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      ) : (
        <View></View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    borderBottomWidth: 1,
    borderBottomColor: "#d1d1d1",
    color: "#000",
    flex: 1,
  },
});
