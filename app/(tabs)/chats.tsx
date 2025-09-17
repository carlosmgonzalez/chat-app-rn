import { useChat, User } from "@/store/chat";
import { router } from "expo-router";
import { ArrowRight, Search } from "lucide-react-native";
import { useState } from "react";
import {
  Text,
  TextInput,
  View,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

export default function Chat() {
  const [userEmail, setUserEmail] = useState("");
  const [userFound, setUserFound] = useState<User | null>({
    id: "3929e99fjh9ajhf90",
    name: "Bretta Abril Medina",
    email: "Bretta@gmail.com",
  });
  const { searchUser } = useChat();

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
        }}
      >
        <TextInput
          value={userEmail}
          onChangeText={setUserEmail}
          placeholder="User email"
          autoCapitalize="none"
          autoCorrect={false}
          placeholderTextColor="#000"
          style={styles.input}
        />
        <TouchableOpacity onPress={() => handleSearchUser(userEmail)}>
          <Search />
        </TouchableOpacity>
      </View>

      {userFound && (
        <TouchableOpacity
          onPress={() => {
            router.push(`/chat/6cddd026-bfac-4369-9112-0ddbb8fb7435`);
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
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: "rgba(230,230,230,0.8)",
    borderRadius: 8,
    color: "#000",
    flex: 1,
  },
});
