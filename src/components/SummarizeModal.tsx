import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
} from "react-native";

type Props = {
  visible: boolean;
  loading: boolean;
  summary: string;
  onClose: () => void;
};

export default function SummarizeModal({
  visible,
  loading,
  summary,
  onClose,
}: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={modal.overlay}>
        <View style={modal.card}>
          <Text style={modal.title}>✦ AIによる要約</Text>
          {loading ? (
            <View style={modal.loadingArea}>
              <ActivityIndicator color="#a78bfa" />
              <Text style={modal.loadingText}>要約中...</Text>
            </View>
          ) : (
            <ScrollView style={modal.scrollArea}>
              <Text style={modal.summaryText}>{summary}</Text>
            </ScrollView>
          )}
          <TouchableOpacity style={modal.closeButton} onPress={onClose}>
            <Text style={modal.closeButtonText}>閉じる</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const modal = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    backgroundColor: "#0d1225",
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.3)",
    maxHeight: "70%",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#a78bfa",
    marginBottom: 16,
  },
  loadingArea: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 12,
  },
  loadingText: {
    color: "#64748b",
    fontSize: 13,
  },
  scrollArea: {
    maxHeight: 300,
  },
  summaryText: {
    color: "#e2e8f0",
    fontSize: 14,
    lineHeight: 22,
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: "rgba(167,139,250,0.15)",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(167,139,250,0.3)",
  },
  closeButtonText: {
    color: "#a78bfa",
    fontSize: 14,
    fontWeight: "600",
  },
});
