import { useState, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, Image
} from "react-native";
import { useRouter } from "expo-router";
import api from "../../services/api";

export default function DiscoverScreen() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(null);
  const router = useRouter();

  useEffect(() => { loadProfiles(); }, []);

  const loadProfiles = async () => {
    try {
      const { data } = await api.get("/matches/discover");
      setProfiles(data.profiles);
    } catch (e) {
      Alert.alert("Erreur", "Impossible de charger les profils.");
    } finally {
      setLoading(false);
    }
  };

  const handleSimulate = async (profileId) => {
    setSimulating(profileId);
    try {
      const { data } = await api.post("/simulations/generate", { target_id: profileId });
      router.push(`/simulation/${data.simulation.id}`);
    } catch (e) {
      if (e.response?.data?.code === "NO_CREDITS") {
        Alert.alert("Plus de simulations", "Passe en Premium pour continuer.", [
          { text: "Voir les offres", onPress: () => router.push("/subscribe") },
          { text: "Annuler" },
        ]);
      } else {
        Alert.alert("Erreur", "Génération impossible. Réessaie.");
      }
    } finally {
      setSimulating(null);
    }
  };

  const handleAction = async (targetId, action) => {
    try {
      const { data } = await api.post("/matches/action", { target_id: targetId, action_type: action });
      setProfiles((prev) => prev.filter((p) => p.profile.id !== targetId));
      if (data.matched) Alert.alert("🖤 Match !", "Vous vous êtes tous les deux likés !");
    } catch {}
  };

  if (loading) return (
    <View style={s.center}>
      <ActivityIndicator color="#c8a97e" size="large" />
    </View>
  );

  if (profiles.length === 0) return (
    <View style={s.center}>
      <Text style={s.emptyIcon}>✦</Text>
      <Text style={s.emptyTitle}>Plus de profils pour l'instant</Text>
      <Text style={s.emptyText}>Reviens plus tard</Text>
      <TouchableOpacity style={s.refreshBtn} onPress={loadProfiles}>
        <Text style={s.refreshText}>Actualiser</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={s.container}>
      <Text style={s.header}>AFTER</Text>
      <ScrollView contentContainerStyle={s.scroll}>
        {profiles.map(({ profile, compatibility }) => (
          <View key={profile.id} style={s.card}>
            {/* Photo / Avatar */}
            <View style={s.avatarWrap}>
              {profile.photos?.[0] ? (
                <Image source={{ uri: profile.photos[0] }} style={s.avatar} />
              ) : (
                <View style={s.avatarPlaceholder}>
                  <Text style={s.avatarLetter}>{profile.name[0]}</Text>
                </View>
              )}
              {/* Score */}
              <View style={s.scoreBadge}>
                <Text style={s.scoreNum}>{compatibility.score}%</Text>
              </View>
            </View>

            <View style={s.cardBody}>
              <Text style={s.name}>{profile.name}, {profile.age}</Text>
              <Text style={s.job}>{profile.job} · {profile.city}</Text>
              <Text style={s.tag}>{compatibility.tag}</Text>
              {profile.bio ? <Text style={s.bio}>"{profile.bio}"</Text> : null}

              {/* Actions */}
              <View style={s.actions}>
                <TouchableOpacity style={s.passBtn} onPress={() => handleAction(profile.id, "pass")}>
                  <Text style={s.passBtnText}>Passer</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[s.simBtn, simulating === profile.id && s.simBtnLoading]}
                  onPress={() => handleSimulate(profile.id)}
                  disabled={!!simulating}
                >
                  <Text style={s.simBtnText}>
                    {simulating === profile.id ? "Génération..." : "Voir notre futur →"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={s.likeBtn} onPress={() => handleAction(profile.id, "like")}>
                  <Text style={s.likeBtnText}>♥</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0d0a07" },
  header: { paddingTop: 60, paddingBottom: 16, textAlign: "center", fontSize: 28, fontStyle: "italic", color: "#c8a97e", letterSpacing: 6 },
  scroll: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, backgroundColor: "#0d0a07", justifyContent: "center", alignItems: "center" },
  emptyIcon: { color: "#c8a97e", fontSize: 32, marginBottom: 16 },
  emptyTitle: { color: "#e8e0d5", fontSize: 18, fontStyle: "italic", marginBottom: 8 },
  emptyText: { color: "#5a4a3a", fontSize: 14 },
  refreshBtn: { marginTop: 24, borderWidth: 1, borderColor: "rgba(200,169,126,0.3)", borderRadius: 8, paddingHorizontal: 24, paddingVertical: 10 },
  refreshText: { color: "#c8a97e", fontSize: 14 },
  card: { backgroundColor: "rgba(255,255,255,0.03)", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", borderRadius: 16, marginBottom: 20, overflow: "hidden" },
  avatarWrap: { position: "relative" },
  avatar: { width: "100%", height: 280, resizeMode: "cover" },
  avatarPlaceholder: { width: "100%", height: 200, backgroundColor: "rgba(200,169,126,0.1)", justifyContent: "center", alignItems: "center" },
  avatarLetter: { fontSize: 64, color: "#c8a97e", fontStyle: "italic" },
  scoreBadge: { position: "absolute", top: 12, right: 12, backgroundColor: "rgba(13,10,7,0.85)", borderWidth: 1, borderColor: "rgba(200,169,126,0.4)", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  scoreNum: { color: "#c8a97e", fontWeight: "700", fontSize: 14 },
  cardBody: { padding: 20 },
  name: { fontSize: 22, color: "#e8e0d5", fontWeight: "600", marginBottom: 2 },
  job: { color: "#7a6a5a", fontSize: 13, marginBottom: 8 },
  tag: { color: "#c8a97e", fontSize: 12, letterSpacing: 1, marginBottom: 10, fontStyle: "italic" },
  bio: { color: "#a09080", fontSize: 13, fontStyle: "italic", marginBottom: 16, lineHeight: 20 },
  actions: { flexDirection: "row", gap: 8, alignItems: "center" },
  passBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  passBtnText: { color: "#5a4a3a", fontSize: 13 },
  simBtn: { flex: 1, backgroundColor: "rgba(200,169,126,0.12)", borderWidth: 1, borderColor: "rgba(200,169,126,0.3)", borderRadius: 8, paddingVertical: 10, alignItems: "center" },
  simBtnLoading: { opacity: 0.6 },
  simBtnText: { color: "#c8a97e", fontSize: 13, fontStyle: "italic" },
  likeBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(200,169,126,0.15)", justifyContent: "center", alignItems: "center" },
  likeBtnText: { color: "#c8a97e", fontSize: 18 },
});
