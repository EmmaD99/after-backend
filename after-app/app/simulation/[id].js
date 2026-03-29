import { useState, useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, ActivityIndicator, SafeAreaView
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import api from "../../services/api";

const STEPS = [
  { key: "chapter_week1", label: "1 semaine" },
  { key: "chapter_month1", label: "1 mois" },
  { key: "chapter_month6", label: "6 mois" },
  { key: "chapter_year1", label: "1 an" },
];

export default function SimulationScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [sim, setSim] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    api.get(`/simulations/${id}`)
      .then(({ data }) => setSim(data))
      .catch(() => router.back())
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <View style={s.center}><ActivityIndicator color="#c8a97e" size="large" /></View>
  );

  if (!sim) return null;

  const currentKey = STEPS[activeStep].key;
  const chapter = sim[currentKey];

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={s.back}>← Retour</Text>
        </TouchableOpacity>
        <View style={s.chemRow}>
          <Text style={s.chemNum}>⚡ {sim.chemistry}%</Text>
          <Text style={s.chemTag}>{sim.tag}</Text>
        </View>
      </View>

      {/* Timeline */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.timeline}>
        {STEPS.map((step, i) => (
          <TouchableOpacity key={i} style={[s.timelineBtn, activeStep === i && s.timelineBtnActive]}
            onPress={() => setActiveStep(i)}>
            <Text style={[s.timelineText, activeStep === i && s.timelineTextActive]}>{step.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      <ScrollView style={s.content} contentContainerStyle={s.contentInner}>
        <Text style={s.vibe}>{chapter.vibe}</Text>
        <Text style={s.title}>{chapter.title}</Text>

        {chapter.type === "messages" && <Messages data={chapter} />}
        {chapter.type === "moment" && <Moment data={chapter} />}
        {chapter.type === "dispute" && <Dispute data={chapter} />}
        {chapter.type === "snapshot" && <Snapshot data={chapter} />}
      </ScrollView>
    </SafeAreaView>
  );
}

function Messages({ data }) {
  const msgs = data.content || [];
  return (
    <View style={s.msgThread}>
      {msgs.map((msg, i) => (
        <View key={i} style={[s.msgRow, msg.from === "user" ? s.msgRight : s.msgLeft]}>
          <View style={[s.bubble, msg.from === "user" ? s.bubbleMe : s.bubbleThem]}>
            <Text style={[s.bubbleText, msg.from === "user" && s.bubbleTextMe]}>{msg.text}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function Moment({ data }) {
  return (
    <View style={s.momentCard}>
      <Text style={s.momentIcon}>✦</Text>
      <Text style={s.momentScene}>{data.scene}</Text>
      <Text style={s.momentDetail}>{data.detail}</Text>
    </View>
  );
}

function Dispute({ data }) {
  return (
    <View>
      <View style={s.triggerCard}>
        <Text style={s.triggerText}>⚡ {data.trigger}</Text>
      </View>
      <Messages data={{ content: data.exchange }} />
      {data.resolution && (
        <View style={s.resolutionCard}>
          <Text style={s.resolutionText}>↗ {data.resolution}</Text>
        </View>
      )}
    </View>
  );
}

function Snapshot({ data }) {
  return (
    <View>
      {(data.scenes || []).map((scene, i) => (
        <View key={i} style={s.sceneCard}>
          <Text style={s.sceneNum}>0{i + 1}</Text>
          <Text style={s.sceneText}>{scene}</Text>
        </View>
      ))}
      {data.verdict && <Text style={s.verdict}>❝ {data.verdict} ❞</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0d0a07" },
  center: { flex: 1, backgroundColor: "#0d0a07", justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)" },
  back: { color: "#7a6a5a", fontSize: 14 },
  chemRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  chemNum: { color: "#c8a97e", fontWeight: "700" },
  chemTag: { color: "#7a6a5a", fontSize: 12 },
  timeline: { borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)", maxHeight: 50 },
  timelineBtn: { paddingHorizontal: 20, paddingVertical: 14 },
  timelineBtnActive: { borderBottomWidth: 2, borderBottomColor: "#c8a97e" },
  timelineText: { color: "#3a2a1a", fontSize: 13 },
  timelineTextActive: { color: "#c8a97e" },
  content: { flex: 1 },
  contentInner: { padding: 24, paddingBottom: 40 },
  vibe: { color: "#5a4a3a", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 },
  title: { color: "#e8e0d5", fontSize: 20, fontStyle: "italic", marginBottom: 24 },
  msgThread: { gap: 10 },
  msgRow: { flexDirection: "row", marginBottom: 4 },
  msgLeft: { justifyContent: "flex-start" },
  msgRight: { justifyContent: "flex-end" },
  bubble: { maxWidth: "75%", padding: 12, borderRadius: 16 },
  bubbleMe: { backgroundColor: "#c8a97e" },
  bubbleThem: { backgroundColor: "rgba(255,255,255,0.07)" },
  bubbleText: { color: "#e8e0d5", fontSize: 14, lineHeight: 20 },
  bubbleTextMe: { color: "#0d0a07" },
  momentCard: { borderWidth: 1, borderColor: "rgba(200,169,126,0.2)", borderRadius: 16, padding: 24 },
  momentIcon: { color: "#c8a97e", fontSize: 20, marginBottom: 12 },
  momentScene: { color: "#d0c5b5", fontSize: 15, fontStyle: "italic", lineHeight: 24, marginBottom: 16 },
  momentDetail: { color: "#c8a97e", fontSize: 13 },
  triggerCard: { backgroundColor: "rgba(220,100,100,0.08)", borderWidth: 1, borderColor: "rgba(220,100,100,0.15)", borderRadius: 10, padding: 14, marginBottom: 16 },
  triggerText: { color: "#c8a0a0", fontSize: 14 },
  resolutionCard: { backgroundColor: "rgba(100,200,130,0.06)", borderWidth: 1, borderColor: "rgba(100,200,130,0.12)", borderRadius: 10, padding: 14, marginTop: 16 },
  resolutionText: { color: "#90c8a0", fontSize: 14, fontStyle: "italic" },
  sceneCard: { flexDirection: "row", gap: 16, padding: 20, borderWidth: 1, borderColor: "rgba(200,169,126,0.1)", borderRadius: 12, marginBottom: 12 },
  sceneNum: { fontSize: 28, color: "#c8a97e", opacity: 0.4, fontStyle: "italic" },
  sceneText: { flex: 1, color: "#c0b5a5", fontSize: 14, fontStyle: "italic", lineHeight: 22 },
  verdict: { color: "#c8a97e", textAlign: "center", fontSize: 16, fontStyle: "italic", padding: 24, lineHeight: 26 },
});
