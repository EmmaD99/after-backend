import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from "react-native";
import { useAuth } from "../../context/AuthContext";

export default function ProfileScreen() {
  const { profile, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert("Déconnexion", "Tu veux vraiment te déconnecter ?", [
      { text: "Annuler" },
      { text: "Oui", onPress: logout, style: "destructive" },
    ]);
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <Text style={s.header}>Mon profil</Text>

      <View style={s.avatarWrap}>
        <View style={s.avatar}>
          <Text style={s.avatarLetter}>{profile?.name?.[0]}</Text>
        </View>
        <Text style={s.name}>{profile?.name}, {profile?.age}</Text>
        <Text style={s.job}>{profile?.job} · {profile?.city}</Text>
      </View>

      {profile?.bio && (
        <View style={s.section}>
          <Text style={s.sectionLabel}>Bio</Text>
          <Text style={s.bio}>"{profile.bio}"</Text>
        </View>
      )}

      <View style={s.section}>
        <Text style={s.sectionLabel}>Plan</Text>
        <View style={s.planBadge}>
          <Text style={s.planText}>{profile?.plan === "free" ? "Gratuit" : profile?.plan}</Text>
        </View>
        {profile?.plan === "free" && (
          <Text style={s.credits}>{profile?.simulations_left} simulation(s) restante(s)</Text>
        )}
      </View>

      {profile?.values?.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionLabel}>Valeurs</Text>
          <View style={s.chips}>
            {profile.values.map((v) => (
              <View key={v} style={s.chip}><Text style={s.chipText}>{v}</Text></View>
            ))}
          </View>
        </View>
      )}

      <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
        <Text style={s.logoutText}>Se déconnecter</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0d0a07" },
  content: { padding: 24, paddingBottom: 40 },
  header: { paddingTop: 36, marginBottom: 32, fontSize: 22, fontStyle: "italic", color: "#c8a97e" },
  avatarWrap: { alignItems: "center", marginBottom: 32 },
  avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: "rgba(200,169,126,0.15)", justifyContent: "center", alignItems: "center", marginBottom: 12 },
  avatarLetter: { color: "#c8a97e", fontSize: 36, fontStyle: "italic" },
  name: { color: "#e8e0d5", fontSize: 22, fontWeight: "600", marginBottom: 4 },
  job: { color: "#7a6a5a", fontSize: 14 },
  section: { marginBottom: 28, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.04)", paddingTop: 20 },
  sectionLabel: { color: "#5a4a3a", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 },
  bio: { color: "#a09080", fontStyle: "italic", fontSize: 15, lineHeight: 22 },
  planBadge: { backgroundColor: "rgba(200,169,126,0.1)", borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6, alignSelf: "flex-start" },
  planText: { color: "#c8a97e", fontWeight: "600" },
  credits: { color: "#5a4a3a", fontSize: 13, marginTop: 8 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: "rgba(200,169,126,0.2)" },
  chipText: { color: "#7a6a5a", fontSize: 12 },
  logoutBtn: { marginTop: 16, borderWidth: 1, borderColor: "rgba(255,100,100,0.2)", borderRadius: 10, padding: 14, alignItems: "center" },
  logoutText: { color: "#c08080", fontSize: 14 },
});
