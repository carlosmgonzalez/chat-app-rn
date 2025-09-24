import { useAuthStore } from "@/store/auth-store";
import { router } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";

export default function Profile() {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.replace("/");
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        marginHorizontal: 10,
        gap: 2,
      }}
    >
      {user && (
        <>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "bold",
            }}
          >
            {user.name}
          </Text>
          <Text
            style={{
              fontSize: 16,
            }}
          >
            {user.email}
          </Text>
          <TouchableOpacity
            onPress={handleLogout}
            style={{
              backgroundColor: "#000",
              borderRadius: 8,
              paddingVertical: 10,
              justifyContent: "center",
              alignItems: "center",
              width: "100%",
              marginTop: 8,
            }}
          >
            <Text
              style={{
                color: "#fff",
                fontWeight: "bold",
              }}
            >
              Logout
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}
