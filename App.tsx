import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { ReceiptDetail } from './src/ReceiptDetail';
import { scanReceipt } from './src/scanner';
import {
  deleteReceiptFiles,
  loadReceipts,
  newId,
  persistScannedImages,
  saveReceipts,
} from './src/storage';
import { colors } from './src/theme';
import type { Receipt } from './src/types';

type Editing = { receipt: Receipt; isNew: boolean } | null;

function parseAmount(amount: string): number {
  const n = parseFloat(amount.replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

function formatMoney(n: number): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function App() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [editing, setEditing] = useState<Editing>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    loadReceipts().then((r) => {
      setReceipts(r);
      setLoaded(true);
    });
  }, []);

  const commit = useCallback((next: Receipt[]) => {
    setReceipts(next);
    saveReceipts(next).catch(() => Alert.alert('Could not save receipts'));
  }, []);

  const startScan = async () => {
    if (scanning) return;
    setScanning(true);
    try {
      const images = await scanReceipt();
      if (!images) return;
      const id = newId();
      const pages = await persistScannedImages(id, images);
      setEditing({
        isNew: true,
        receipt: {
          id,
          pages,
          merchant: '',
          amount: '',
          category: 'Other',
          note: '',
          createdAt: new Date().toISOString(),
        },
      });
    } catch (e) {
      Alert.alert('Scan failed', e instanceof Error ? e.message : String(e));
    } finally {
      setScanning(false);
    }
  };

  const handleSave = (r: Receipt) => {
    const exists = receipts.some((x) => x.id === r.id);
    commit(exists ? receipts.map((x) => (x.id === r.id ? r : x)) : [r, ...receipts]);
    setEditing(null);
  };

  const handleDelete = (r: Receipt) => {
    deleteReceiptFiles(r);
    commit(receipts.filter((x) => x.id !== r.id));
    setEditing(null);
  };

  const handleClose = () => {
    // A brand-new scan that is closed without saving is discarded.
    if (editing?.isNew) deleteReceiptFiles(editing.receipt);
    setEditing(null);
  };

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return receipts;
    return receipts.filter((r) =>
      [r.merchant, r.category, r.note, r.amount].some((f) => f.toLowerCase().includes(q)),
    );
  }, [receipts, query]);

  const total = useMemo(
    () => visible.reduce((sum, r) => sum + parseAmount(r.amount), 0),
    [visible],
  );

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Receipts</Text>
          <Text style={styles.subtitle}>
            {visible.length} {visible.length === 1 ? 'receipt' : 'receipts'} · {formatMoney(total)}
          </Text>
        </View>

        {receipts.length > 0 && (
          <TextInput
            style={styles.search}
            value={query}
            onChangeText={setQuery}
            placeholder="Search merchant, category, note"
            placeholderTextColor={colors.muted}
            clearButtonMode="while-editing"
          />
        )}

        {!loaded ? (
          <ActivityIndicator style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={visible}
            keyExtractor={(r) => r.id}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>
                  {receipts.length === 0 ? 'No receipts yet' : 'No matches'}
                </Text>
                {receipts.length === 0 && (
                  <Text style={styles.emptyText}>
                    Tap “Scan receipt”, point the camera at a receipt and it will be found, cropped
                    and straightened automatically.
                  </Text>
                )}
              </View>
            }
            renderItem={({ item }) => (
              <Pressable
                style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
                onPress={() => setEditing({ receipt: item, isNew: false })}
              >
                <Image source={{ uri: item.pages[0] }} style={styles.thumb} contentFit="cover" />
                <View style={styles.rowText}>
                  <Text style={styles.merchant} numberOfLines={1}>
                    {item.merchant || 'Untitled receipt'}
                  </Text>
                  <Text style={styles.rowMeta}>
                    {item.category} · {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={styles.amount}>
                  {item.amount ? formatMoney(parseAmount(item.amount)) : '—'}
                </Text>
              </Pressable>
            )}
          />
        )}

        <SafeAreaView edges={['bottom']} style={styles.footer}>
          <Pressable
            style={({ pressed }) => [styles.scanButton, pressed && { opacity: 0.85 }]}
            onPress={startScan}
            disabled={scanning}
          >
            {scanning ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.scanButtonText}>Scan receipt</Text>
            )}
          </Pressable>
        </SafeAreaView>
      </SafeAreaView>

      <Modal
        visible={editing !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleClose}
      >
        {editing && (
          <SafeAreaProvider>
            <ReceiptDetail
              receipt={editing.receipt}
              isNew={editing.isNew}
              onSave={handleSave}
              onDelete={handleDelete}
              onClose={handleClose}
            />
          </SafeAreaProvider>
        )}
      </Modal>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  title: { fontSize: 32, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 15, color: colors.muted, marginTop: 2 },
  search: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: colors.card,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.text,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  list: { paddingHorizontal: 16, paddingBottom: 24, flexGrow: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 10,
    marginTop: 8,
    gap: 12,
  },
  thumb: { width: 48, height: 64, borderRadius: 6, backgroundColor: colors.bg },
  rowText: { flex: 1 },
  merchant: { fontSize: 16, fontWeight: '600', color: colors.text },
  rowMeta: { fontSize: 13, color: colors.muted, marginTop: 2 },
  amount: { fontSize: 16, fontWeight: '600', color: colors.text, fontVariant: ['tabular-nums'] },
  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 24 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
  emptyText: { fontSize: 15, color: colors.muted, textAlign: 'center', marginTop: 8, lineHeight: 21 },
  footer: { paddingHorizontal: 16, paddingTop: 8, backgroundColor: colors.bg },
  scanButton: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  scanButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
