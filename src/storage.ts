import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directory, File, Paths } from 'expo-file-system';
import type { Receipt } from './types';

const STORAGE_KEY = 'receipts:v1';

function receiptsDir(): Directory {
  const dir = new Directory(Paths.document, 'receipts');
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  return dir;
}

export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function loadReceipts(): Promise<Receipt[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Receipt[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveReceipts(receipts: Receipt[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(receipts));
}

/**
 * The scanner writes its cropped images to a temporary/cache location.
 * Copy them into the app's document directory so they survive cache cleanup.
 */
export async function persistScannedImages(id: string, uris: string[]): Promise<string[]> {
  const dir = receiptsDir();
  const saved: string[] = [];
  for (let i = 0; i < uris.length; i++) {
    const uri = uris[i].startsWith('file://') ? uris[i] : `file://${uris[i]}`;
    const source = new File(uri);
    const ext = source.extension || '.jpg';
    const dest = new File(dir, `${id}-${i + 1}${ext}`);
    await source.copy(dest);
    saved.push(dest.uri);
  }
  return saved;
}

export function deleteReceiptFiles(receipt: Receipt): void {
  for (const uri of receipt.pages) {
    try {
      const file = new File(uri);
      if (file.exists) file.delete();
    } catch {
      // Ignore files that are already gone.
    }
  }
}
