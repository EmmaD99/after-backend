import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text, TextInput, TouchableOpacity,
  View
} from "react-native";
import { useAuth } from "../context/AuthContext";

const STEPS = ["Infos", "Personnalité", "Valeurs"];
const VALUES = ["famille", "voyages", "carrière", "amour", "liberté", "nature", "art", "sport", "spiritualité", "amitié"];
const RELATION_TYPES = ["sérieux", "casual", "amitié", "ouvert"];
const GENDERS = ["homme", "femme", "non-binaire", "autre"];

function TraitSlider({ label, traitKey, form, onSet }) {
  return (
    <View style={s.traitRow}>
      <Text style={s.traitLabel}>{label}</Text>
      <View style={s.traitBtns}>
        {[1, 2, 3, 4, 5].map((v) => (
          <TouchableOpacity
            key={v}
            style={[s.traitBtn, form[traitKey] === v && s.traitBtnActive]}
            onPress={() => onSet(traitKey, v)}
          >
            <Text style={[s.traitBtnText, form[traitKey] === v && s.traitBtnTextActive]}>{v}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export default function OnboardingScreen() {
  const { updateProfile } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    age: "", city: "", gender: "femme", seeking: [],
    bio: "", job: "",
    trait_adventure: 3, trait_creativity: 3, trait_ambition: 3,
    trait_empathy: 3, trait_humor: 3, trait_spontaneity: 3,
    values: [], relation_type: [],
  });

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const toggleArr = (key, val) => {
    setForm((f) => ({
      ...f,
      [key]: f[key].includes(val) ? f[key].filter((v) => v !== val) : [...f[key], val],
    }));
  };

  const next = async () => {
    if (step < STEPS.length - 1) return setStep(step + 1);
    if (!form.age || !form.city || form.seeking.length === 0)
      return Alert.alert("Erreur", "Remplis tous les champs obligatoires.");
    setLoading(true);
    try {
      await updateProfile({ ...form, age: parseInt(form.age) });
      router.replace("/(tabs)/discover");
    } catch (e) {
      Alert.alert("Erreur", e.response?.data?.error || e.message || "Erreur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.container}>
      <View style={s.progress}>
        {STEPS.map((label, i) => (
          <View key={i} style={[s.progressDot, i <= step && s.progressDotActive]} />
        ))}
      </View>
      <Text style={s.stepTitle}>{STEPS[step]}</Text>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent}>
        {step === 0 && (
          <>
            <Text style={s.label}>Ton âge *</Text>
            <TextInput style={s.input} placeholder="25" placeholderTextColor="#5a4a3a"
              value={form.age} onChangeText={(v) => set("age", v)} keyboardType="numeric" />
            <Text style={s.label}>Ta ville *</Text>
            <TextInput style={s.input} placeholder="Paris" placeholderTextColor="#5a4a3a"
              value={form.city} onChangeText={(v) => set("city", v)} />
            <Text style={s.label}>Ton métier</Text>
            <TextInput style={s.input} placeholder="Designer, étudiant..." placeholderTextColor="#5a4a3a"
              value={form.job} onChangeText={(v) => set("job", v)} />
            <Text style={s.label}>Ta bio</Text>
            <TextInput style={[s.input, { height: 80 }]} placeholder="En quelques mots..."
              placeholderTextColor="#5a4a3a" value={form.bio} onChangeText={(v) => set("bio", v)}
              multiline maxLength={300} />
            <Text style={s.label}>Tu es *</Text>
            <View style={s.chips}>
              {GENDERS.map((g) => (
                <TouchableOpacity key={g} style={[s.chip, form.gender === g && s.chipActive]}
                  onPress={() => set("gender", g)}>
                  <Text style={[s.chipText, form.gender === g && s.chipTextActive]}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={s.label}>Tu cherches *</Text>
            <View style={s.chips}>
              {GENDERS.map((g) => (
                <TouchableOpacity key={g} style={[s.chip, form.seeking.includes(g) && s.chipActive]}
                  onPress={() => toggleArr("seeking", g)}>
                  <Text style={[s.chipText, form.seeking.includes(g) && s.chipTextActive]}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {step === 1 && (
          <>
            <Text style={s.sectionDesc}>Note tes traits de 1 (peu) à 5 (très)</Text>
            <TraitSlider label="Aventurier·ère" traitKey="trait_adventure" form={form} onSet={set} />
            <TraitSlider label="Créatif·ve" traitKey="trait_creativity" form={form} onSet={set} />
            <TraitSlider label="Ambitieux·se" traitKey="trait_ambition" form={form} onSet={set} />
            <TraitSlider label="Empathique" traitKey="trait_empathy" form={form} onSet={set} />
            <TraitSlider label="Drôle" traitKey="trait_humor" form={form} onSet={set} />
            <TraitSlider label="Spontané·e" traitKey="trait_spontaneity" form={form} onSet={set} />
          </>
        )}

        {step === 2 && (
          <>
            <Text style={s.label}>Tes valeurs</Text>
            <View style={s.chips}>
              {VALUES.map((v) => (
                <TouchableOpacity key={v} style={[s.chip, form.values.includes(v) && s.chipActive]}
                  onPress={() => toggleArr("values", v)}>
                  <Text style={[s.chipText, form.values.includes(v) && s.chipTextActive]}>{v}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={s.label}>Tu cherches</Text>
            <View style={s.chips}>
              {RELATION_TYPES.map((r) => (
                <TouchableOpacity key={r} style={[s.chip, form.relation_type.includes(r) && s.chipActive]}
                  onPress={() => toggleArr("relation_type", r)}>
                  <Text style={[s.chipText, form.relation_type.includes(r) && s.chipTextActive]}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </ScrollView>

      <TouchableOpacity style={s.btn} onPress={next} disabled={loading}>
        <Text style={s.btnText}>
          {loading ? "Sauvegarde..." : step < STEPS.length - 1 ? "Continuer →" : "Terminer"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0d0a07", paddingTop: 60 },
  progress: { flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: 8 },
  progressDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#2a2018" },
  progressDotActive: { backgroundColor: "#c8a97e" },
  stepTitle: { color: "#c8a97e", textAlign: "center", fontSize: 22, fontStyle: "italic", marginBottom: 24 },
  scroll: { flex: 1 },
  scrollContent: { padding: 24 },
  label: { color: "#8a7a6a", fontSize: 13, letterSpacing: 1, marginBottom: 8, marginTop: 16 },
  sectionDesc: { color: "#5a4a3a", fontSize: 13, marginBottom: 20, fontStyle: "italic" },
  input: {
    borderWidth: 1, borderColor: "rgba(200,169,126,0.2)", borderRadius: 10,
    padding: 14, color: "#e8e0d5", fontSize: 15, backgroundColor: "rgba(255,255,255,0.03)",
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: "rgba(200,169,126,0.2)" },
  chipActive: { backgroundColor: "rgba(200,169,126,0.15)", borderColor: "#c8a97e" },
  chipText: { color: "#5a4a3a", fontSize: 13 },
  chipTextActive: { color: "#c8a97e" },
  traitRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  traitLabel: { color: "#a09080", fontSize: 14, flex: 1 },
  traitBtns: { flexDirection: "row", gap: 6 },
  traitBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: "rgba(200,169,126,0.2)", justifyContent: "center", alignItems: "center" },
  traitBtnActive: { backgroundColor: "#c8a97e", borderColor: "#c8a97e" },
  traitBtnText: { color: "#5a4a3a", fontSize: 14 },
  traitBtnTextActive: { color: "#0d0a07", fontWeight: "700" },
  btn: { backgroundColor: "#c8a97e", margin: 24, borderRadius: 12, padding: 16, alignItems: "center" },
  btnText: { color: "#0d0a07", fontWeight: "700", fontSize: 16 },
});