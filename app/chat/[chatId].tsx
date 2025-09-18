import { useWebSocket } from "@/hooks/use-websocket";
import { useAuthStore } from "@/store/auth-store";
import { Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Text, View } from "react-native";
import { GiftedChat } from "react-native-gifted-chat";
import type { Message } from "@/types/chat-types";
import { useChat } from "@/hooks/use-chat";

export default function ChatPage() {
  const { chatId, userName }: { chatId: string; userName: string } =
    useLocalSearchParams();

  const { getChat } = useChat();
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    // This effect fetches the initial chat history and ensures it's only done once
    // and that the message list is cleared when the chat changes.
    let isCancelled = false;
    const getChatHistory = async () => {
      const chatHistory = await getChat(chatId);
      if (!isCancelled) {
        // Use an empty array as the first argument to replace existing messages,
        // preventing duplicates if the effect runs multiple times.
        setMessages(GiftedChat.append([], chatHistory));
      }
    };

    getChatHistory();

    return () => {
      isCancelled = true;
    };
  }, [chatId, getChat]);

  const [typingUsers, setTypingUsers] = useState<any[]>([]);
  const handleTyping = () => {
    sendTyping(chatId);
  };

  const { user } = useAuthStore();
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
  }, [chatId, isConnected, subscribeToChat, unsubscribeFromChat]);

  useEffect(() => {
    // Handle new messages from other users
    const unsubscribeMessages = on("new_message", (data) => {
      if (data.chat_id === chatId) {
        setMessages((previousMessages) =>
          GiftedChat.append(previousMessages, [
            {
              _id: data.message_id,
              text: data.content.message,
              createdAt: data.content.created_at,
              user: {
                _id: data.sender.id,
                name: data.sender.name,
              },
            },
          ]),
        );
      }
    });

    // Handle typing indicators
    const unsubscribeTyping = on("typing", (data) => {
      if (data.chat_id === chatId) {
        setTypingUsers((prev) => {
          if (!prev.includes(data.user_id)) {
            return [...prev, data.user_id];
          }
          return prev;
        });

        // Remove typing indicator after 3 seconds
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

  const onSend = useCallback(
    (messages: Message[] = []) => {
      const content = {
        message: messages[0].text,
      };
      sendMessage(chatId, content);
      // Optimistically update the UI with the new message
      setMessages((previousMessages) =>
        GiftedChat.append(previousMessages, messages),
      );
    },
    [chatId, sendMessage],
  );

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          title: userName,
        }}
      />
      <GiftedChat
        messagesContainerStyle={{
          paddingBottom: 10,
        }}
        messages={messages}
        onSend={(messages) => onSend(messages as any)}
        user={{
          _id: user!.id,
          avatar:
            "https://lh3.googleusercontent.com/a/ACg8ocIQYmDHhfJP4vdqu6d5WhBP-3jnjdossIu91FLVna2Q5SnIinoshg=s96-c",
          name: user!.name,
        }}
        keyboardShouldPersistTaps="never"
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
    </View>
  );
}
