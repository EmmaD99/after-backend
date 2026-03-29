import { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from "react-native";
import { useRouter } from "expo-router";
import api from "../../services/api";

export default function SimulationsScreen() {
  const [sims, setSims] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    api.get("/simulations").then(({ data }) => setSims(data.simulations)).finally(() => setLoading(false));
  }, []);

  if (loading) return <View style={s.center}><ActivityIndicator color="#c8a97e" /></View>;

  return (
    <View style={s.container}>
      <Text style={s.header}>Mes futurs</Text>
      {sims.length === 0 ? (
        <View style={s.center}>
          <Text style={s.emptyIcon}>✦</Text>
          <Text style={s.empty}>Aucune simulation encore</Text>
          <Text style={s.emptySub}>Découvre des profils pour commencer</Text>
        </View>
      ) : (
        <FlatList
          data={sims}
          keyExtractor={(s) => s.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <TouchableOpacity style={s.card} onPress={() => router.push(`/simulation/${item.id}`)}>
              {item.target?.photos?.[0] ? (
                <Image source={{ uri: item.target.photos[0] }} style={s.avatar} />
              ) : (
                <View style={s.avatarPlaceholder}>
                  <Text style={s.avatarLetter}>{item.target?.name?.[0]}</Text>
                </View>
              )}
              <View style={s.info}>
                <Text style={s.name}>{item.target?.name}, {item.target?.age}</Text>
                <Text style={s.tag}>{item.tag}</Text>
              </View>
              <View style={s.scoreBadge}>
                <Text style={s.score}>⚡{item.chemistry}%</Text>
              </View>
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
  emptyIcon: { color: "#c8a97e", fontSize: 32, marginBottom: 12 },
  empty: { color: "#e8e0d5", fontSize: 16, fontStyle: "italic" },
  emptySub: { color: "#5a4a3a", fontSize: 13, marginTop: 4 },
  card: { flexDirection: "row", alignItems: "center", padding: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", borderRadius: 12, marginBottom: 10, backgroundColor: "rgba(255,255,255,0.02)" },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarPlaceholder: { width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(200,169,126,0.15)", justifyContent: "center", alignItems: "center" },
  avatarLetter: { color: "#c8a97e", fontSize: 20, fontStyle: "italic" },
  info: { flex: 1, marginLeft: 14 },
  name: { color: "#e8e0d5", fontSize: 15, fontWeight: "600" },
  tag: { color: "#c8a97e", fontSize: 12, fontStyle: "italic", marginTop: 2 },
  scoreBadge: { backgroundColor: "rgba(200,169,126,0.1)", borderRadius: 16, paddingHorizontal: 10, paddingVertical: 4 },
  score: { color: "#c8a97e", fontSize: 13, fontWeight: "700" },
});
