import { useChat } from "@/hooks/use-chat";
import { useWebSocketStore } from "@/store/websocket-store";
import { fetchChats } from "@/services/chat-service";
import { useAuthStore } from "@/store/auth-store";
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
  RefreshControl,
} from "react-native";

export default function Chat() {
  const { user } = useAuthStore();
  const { searchUser, getChatBetweenUsers } = useChat();
  const { isConnected, actions } = useWebSocketStore();

  const [userEmail, setUserEmail] = useState("");
  const [userFound, setUserFound] = useState<User | null>();

  const [userChats, setUserChats] = useState<UserChats[]>([]);

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const chats = await fetchChats();
      setUserChats(chats);
    } catch (err) {
      console.log(err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    let fetchedChats: UserChats[] = [];

    const getAllChats = async () => {
      try {
        const chats = await fetchChats();
        if (!isMounted) return;

        fetchedChats = chats;
        setUserChats(chats);

        if (isConnected) {
          fetchedChats.forEach((chat) => actions.subscribeToChat(chat.id));
        }
      } catch (error) {
        console.error(error);
      }
    };

    getAllChats();

    return () => {
      isMounted = false;
      if (isConnected && fetchedChats.length > 0) {
        fetchedChats.forEach((chat) => actions.unsubscribeFromChat(chat.id));
      }
    };
  }, [isConnected, actions]);

  useEffect(() => {
    const newChat = actions.on("new_chat", (data) => {
      console.log("Nuevo chat recibido:", data);
      setUserChats((prev) => [
        ...prev,
        {
          id: data.chat_id,
          users: [
            { id: user!.id, email: user!.email, name: user!.name },
            {
              id: data.sender_user.id, // Cambiado de receiver_user a sender_user
              email: data.sender_user.email,
              name: data.sender_user.name,
            },
          ],
          created_at: new Date(),
        },
      ]);
    });

    return () => {
      newChat();
    };
  }, [actions, user]);

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
            // Verificar si ya existe un chat
            const existingChat = await getChatBetweenUsers(userFound.id);

            router.push({
              pathname: "/chat/[chatId]",
              params: {
                chatId: existingChat?.id || "new",
                receiverUserId: userFound.id,
                receiverUserName: userFound.name,
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
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          data={userChats}
          keyExtractor={({ id }) => id}
          renderItem={({ item }) => {
            const chat = item;
            const receiverUser = chat.users.find((u) => u.id !== user?.id);
            if (receiverUser) {
              return (
                <TouchableOpacity
                  onPress={async () => {
                    router.push({
                      pathname: "/chat/[chatId]",
                      params: {
                        chatId: chat.id,
                        receiverUserId: receiverUser.id,
                        receiverUserName: receiverUser.name,
                      },
                    });
                  }}
                  style={{
                    backgroundColor: "rgba(230,230,230,0.6)",
                    borderRadius: 8,
                    marginBottom: 10,
                    paddingVertical: 14,
                    paddingHorizontal: 16,
                    flexDirection: "row",
                    width: "100%",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <View style={{ flexDirection: "column" }}>
                    <Text style={{ fontSize: 18 }}>{receiverUser.name}</Text>
                    <Text style={{ fontSize: 16, color: "#757575" }}>
                      {receiverUser.email}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            } else {
              return <></>;
            }
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
