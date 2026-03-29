import { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from "react-native";
import { useRouter } from "expo-router";
import api from "../../services/api";

export default function MatchesScreen() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    api.get("/matches").then(({ data }) => setMatches(data.matches)).finally(() => setLoading(false));
  }, []);

  if (loading) return <View style={s.center}><ActivityIndicator color="#c8a97e" /></View>;

  return (
    <View style={s.container}>
      <Text style={s.header}>Mes matchs</Text>
      {matches.length === 0 ? (
        <View style={s.center}>
          <Text style={s.emptyIcon}>🖤</Text>
          <Text style={s.empty}>Pas encore de matchs</Text>
          <Text style={s.emptySub}>Génère des simulations pour matcher</Text>
        </View>
      ) : (
        <FlatList
          data={matches}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <TouchableOpacity style={s.card} onPress={() => router.push(`/chat/${item.id}`)}>
              {item.other?.photos?.[0] ? (
                <Image source={{ uri: item.other.photos[0] }} style={s.avatar} />
              ) : (
                <View style={s.avatarPlaceholder}>
                  <Text style={s.avatarLetter}>{item.other?.name?.[0]}</Text>
                </View>
              )}
              <View style={s.info}>
                <Text style={s.name}>{item.other?.name}, {item.other?.age}</Text>
                <Text style={s.sub}>{item.other?.city}</Text>
              </View>
              {item.simulation_id && <Text style={s.simIcon}>✦</Text>}
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0d0a07" },
  header: { paddingTop: 60, paddingBottom: 16, paddingHorizontal: 24, fontSize: 22, fontStyle: "italic", color: "#c8a97e" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyIcon: { fontSize: 32, marginBottom: 12 },
  empty: { color: "#e8e0d5", fontSize: 16, fontStyle: "italic" },
  emptySub: { color: "#5a4a3a", fontSize: 13, marginTop: 4 },
  card: { flexDirection: "row", alignItems: "center", padding: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", borderRadius: 12, marginBottom: 10, backgroundColor: "rgba(255,255,255,0.02)" },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarPlaceholder: { width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(200,169,126,0.15)", justifyContent: "center", alignItems: "center" },
  avatarLetter: { color: "#c8a97e", fontSize: 20, fontStyle: "italic" },
  info: { flex: 1, marginLeft: 14 },
  name: { color: "#e8e0d5", fontSize: 15, fontWeight: "600" },
  sub: { color: "#5a4a3a", fontSize: 12, marginTop: 2 },
  simIcon: { color: "#c8a97e", fontSize: 16 },
});
