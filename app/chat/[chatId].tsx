import { useWebSocket } from "@/hooks/websocket";
import { useAuth } from "@/store/auth-store";
import { BASE_URL } from "@/utlis/constants";
import { Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Text, View } from "react-native";
import { GiftedChat, QuickReplies, User } from "react-native-gifted-chat";

export interface IMessage {
  _id: string | number;
  text: string;
  createdAt: Date | number;
  user: User;
  image?: string;
  video?: string;
  audio?: string;
  system?: boolean;
  sent?: boolean;
  received?: boolean;
  pending?: boolean;
  quickReplies?: QuickReplies;
}

export interface IChat {
  id: string;
  type: string;
  name: string;
  created_at: Date;
  users: User[];
  messages: MessageChat[];
}

export interface MessageChat {
  id: string;
  content: string;
  sent_at: Date;
  sender: User;
}

export default function Chat() {
  const { chatId, userName }: { chatId: string; userName: string } =
    useLocalSearchParams();
  const [messages, setMessages] = useState<IMessage[]>([]);

  useEffect(() => {
    const getChatInformation = async () => {
      const res = await fetch(`${BASE_URL}/chat/${chatId}`);
      const chat = (await res.json()) as IChat;

      setMessages(
        chat.messages.map((message) => ({
          _id: message.id,
          createdAt: new Date(message.sent_at),
          text: message.content,
          user: {
            _id: String(message.sender._id),
          },
        })),
      );
    };

    getChatInformation();
  }, [chatId]);

  const [typingUsers, setTypingUsers] = useState<any[]>([]);
  const { user } = useAuth();
  const {
    isConnected,
    subscribeToChat,
    unsubscribeFromChat,
    on,
    sendTyping,
    sendMessage,
  } = useWebSocket(user!.id);

  useEffect(() => {
    if (isConnected) {
      subscribeToChat(chatId);
    }

    return () => {
      if (isConnected) {
        unsubscribeFromChat(chatId);
      }
    };
  }, [chatId, isConnected]);

  useEffect(() => {
    // Manejar nuevos mensajes
    const unsubscribeMessages = on("new_message", (data) => {
      if (data.chat_id === chatId) {
        setMessages((previousMessages) =>
          GiftedChat.append(previousMessages, [
            {
              _id: data.message_id,
              text: data.content.message,
              createdAt: data.content.created_at,
              user: {
                _id: data.user_id,
                name: data.name,
              },
            },
          ]),
        );
      }
    });

    // Manejar indicadores de escritura
    const unsubscribeTyping = on("typing", (data) => {
      if (data.chat_id === chatId) {
        setTypingUsers((prev) => {
          if (!prev.includes(data.user_id)) {
            return [...prev, data.user_id];
          }
          return prev;
        });

        // Quitar indicador después de 3 segundos
        setTimeout(() => {
          setTypingUsers((prev) => prev.filter((id) => id !== data.user_id));
        }, 3000);
      }
    });

    return () => {
      unsubscribeMessages();
      unsubscribeTyping();
    };
  }, [chatId, on]);

  const handleTyping = () => {
    sendTyping(chatId);
  };

  const onSend = useCallback(
    (messages: IMessage[] = []) => {
      console.log(messages);
      const content = {
        message: messages[0].text,
        created_at: messages[0].createdAt,
      };
      sendMessage(chatId, content);
      setMessages((previousMessages) =>
        GiftedChat.append(previousMessages, messages),
      );
    },
    [chatId, sendMessage],
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: userName,
        }}
      />
      <GiftedChat
        messages={messages}
        onSend={(messages) => onSend(messages as any)}
        user={{
          _id: user!.id,
          avatar:
            "https://lh3.googleusercontent.com/a/ACg8ocIQYmDHhfJP4vdqu6d5WhBP-3jnjdossIu91FLVna2Q5SnIinoshg=s96-c",
          name: user!.name,
        }}
        renderMessage={({ currentMessage }) => {
          const isMyMessage = currentMessage.user._id === user!.id;
          return (
            <View
              style={{
                alignItems: isMyMessage ? "flex-end" : "flex-start",
                marginVertical: 2,
                marginHorizontal: 10,
              }}
            >
              {currentMessage && (
                <View
                  style={{
                    backgroundColor: isMyMessage ? "#dcf8c6" : "#fff",
                    borderRadius: 12,
                    padding: 10,
                    maxWidth: "80%",
                    elevation: 1,
                    shadowColor: "#000",
                    shadowOpacity: 0.1,
                    shadowRadius: 1,
                    shadowOffset: { width: 0, height: 1 },
                  }}
                >
                  {!isMyMessage && currentMessage.user.name && (
                    <Text
                      style={{
                        color: "#36b3a6",
                        fontWeight: "bold",
                        marginBottom: 5,
                      }}
                    >
                      {currentMessage.user.name}
                    </Text>
                  )}
                  <Text style={{ fontSize: 16, color: "#333" }}>
                    {currentMessage.text}
                  </Text>
                  <View style={{ alignItems: "flex-end", marginTop: 4 }}>
                    <Text style={{ fontSize: 11, color: "#888" }}>
                      {new Date(currentMessage.createdAt).toLocaleTimeString(
                        [],
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          );
        }}
      />
    </>
  );
}
