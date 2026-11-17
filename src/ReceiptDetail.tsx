import { Image } from 'expo-image';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from './theme';
import { CATEGORIES, type Receipt } from './types';

interface Props {
  receipt: Receipt;
  isNew: boolean;
  onSave: (receipt: Receipt) => void;
  onDelete: (receipt: Receipt) => void;
  onClose: () => void;
}

export function ReceiptDetail({ receipt, isNew, onSave, onDelete, onClose }: Props) {
  const [draft, setDraft] = useState<Receipt>(receipt);
  const { width } = useWindowDimensions();
  const pageWidth = width - 32;

  const update = <K extends keyof Receipt>(key: K, value: Receipt[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const share = async () => {
    if (!(await Sharing.isAvailableAsync())) {
      Alert.alert('Sharing is not available on this device');
      return;
    }
    await Sharing.shareAsync(draft.pages[0], { mimeType: 'image/jpeg' });
  };

  const confirmDelete = () =>
    Alert.alert('Delete receipt?', 'The scanned image will be removed from this phone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete(receipt) },
    ]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={onClose} hitSlop={12}>
          <Text style={styles.headerLink}>{isNew ? 'Discard' : 'Close'}</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{isNew ? 'New receipt' : 'Receipt'}</Text>
        <Pressable onPress={() => onSave(draft)} hitSlop={12}>
          <Text style={[styles.headerLink, styles.bold]}>Save</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {draft.pages.map((uri, i) => (
            <Image
              key={uri}
              source={{ uri }}
              style={[styles.page, { width: pageWidth, height: pageWidth * 1.4 }]}
              contentFit="contain"
              accessibilityLabel={`Receipt page ${i + 1}`}
            />
          ))}

          <Field label="Merchant">
            <TextInput
              style={styles.input}
              value={draft.merchant}
              onChangeText={(t) => update('merchant', t)}
              placeholder="e.g. Corner Café"
              placeholderTextColor={colors.muted}
            />
          </Field>

          <Field label="Total">
            <TextInput
              style={styles.input}
              value={draft.amount}
              onChangeText={(t) => update('amount', t.replace(/[^0-9.,]/g, ''))}
              placeholder="0.00"
              placeholderTextColor={colors.muted}
              keyboardType="decimal-pad"
            />
          </Field>

          <Field label="Category">
            <View style={styles.chips}>
              {CATEGORIES.map((c) => {
                const active = draft.category === c;
                return (
                  <Pressable
                    key={c}
                    onPress={() => update('category', c)}
                    style={[styles.chip, active && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{c}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Field>

          <Field label="Note">
            <TextInput
              style={[styles.input, styles.multiline]}
              value={draft.note}
              onChangeText={(t) => update('note', t)}
              placeholder="Optional"
              placeholderTextColor={colors.muted}
              multiline
            />
          </Field>

          <Text style={styles.meta}>
            Scanned {new Date(draft.createdAt).toLocaleString()} · {draft.pages.length}{' '}
            {draft.pages.length === 1 ? 'page' : 'pages'}
          </Text>

          <View style={styles.actions}>
            <Pressable style={styles.secondaryButton} onPress={share}>
              <Text style={styles.secondaryButtonText}>Share image</Text>
            </Pressable>
            {!isNew && (
              <Pressable style={styles.dangerButton} onPress={confirmDelete}>
                <Text style={styles.dangerButtonText}>Delete</Text>
              </Pressable>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headerTitle: { fontSize: 17, fontWeight: '600', color: colors.text },
  headerLink: { fontSize: 17, color: colors.accent },
  bold: { fontWeight: '700' },
  content: { padding: 16, paddingBottom: 48 },
  page: {
    borderRadius: 12,
    backgroundColor: colors.card,
    marginBottom: 16,
  },
  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: colors.muted, marginBottom: 6 },
  input: {
    backgroundColor: colors.card,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: colors.text, fontSize: 14 },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  meta: { color: colors.muted, fontSize: 13, marginBottom: 16 },
  actions: { flexDirection: 'row', gap: 12 },
  secondaryButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  secondaryButtonText: { color: colors.accent, fontSize: 16, fontWeight: '600' },
  dangerButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: colors.dangerBg,
  },
  dangerButtonText: { color: colors.danger, fontSize: 16, fontWeight: '600' },
});
