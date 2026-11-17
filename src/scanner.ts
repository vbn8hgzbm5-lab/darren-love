import DocumentScanner, { ScanDocumentResponseStatus } from 'react-native-document-scanner-plugin';

/**
 * Opens the platform document scanner (VisionKit on iOS, ML Kit on Android).
 * Both detect the receipt's edges, crop it and correct its perspective
 * automatically, and let the user adjust the corners before saving.
 *
 * Returns the cropped image paths, or null if the user cancelled.
 */
export async function scanReceipt(): Promise<string[] | null> {
  const result = await DocumentScanner.scanDocument({
    croppedImageQuality: 90,
    // Long receipts can be captured as several pages.
    maxNumDocuments: 5,
  });
  if (result.status === ScanDocumentResponseStatus.Cancel) return null;
  const images = result.scannedImages ?? [];
  return images.length > 0 ? images : null;
}
