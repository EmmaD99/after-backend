import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#0d0a07",
          borderTopColor: "rgba(200,169,126,0.1)",
          borderTopWidth: 1,
          paddingBottom: 8,
          height: 60,
        },
        tabBarActiveTintColor: "#c8a97e",
        tabBarInactiveTintColor: "#3a2a1a",
        tabBarLabelStyle: { fontSize: 11, letterSpacing: 0.5 },
      }}
    >
      <Tabs.Screen name="discover" options={{
        title: "Découvrir",
        tabBarIcon: ({ color, size }) => <Ionicons name="heart-outline" size={size} color={color} />,
      }} />
      <Tabs.Screen name="matches" options={{
        title: "Matchs",
        tabBarIcon: ({ color, size }) => <Ionicons name="chatbubble-outline" size={size} color={color} />,
      }} />
      <Tabs.Screen name="simulations" options={{
        title: "Futures",
        tabBarIcon: ({ color, size }) => <Ionicons name="time-outline" size={size} color={color} />,
      }} />
      <Tabs.Screen name="profile" options={{
        title: "Moi",
        tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
      }} />
    </Tabs>
  );
}
