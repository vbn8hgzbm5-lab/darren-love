# Receipt Scanner

A mobile app (iOS and Android) for scanning receipts. Point the camera at a receipt and it is
found, cropped and straightened automatically. You can then add the merchant, total, category
and a note, and keep everything on your phone.

## How the auto-crop works

Scanning uses the phone's built-in document scanner through
[`react-native-document-scanner-plugin`](https://github.com/WebsiteBeaver/react-native-document-scanner-plugin):

- **iOS:** Apple VisionKit
- **Android:** Google ML Kit Document Scanner

Both detect the receipt's edges live in the camera view, crop it, correct the perspective and let
you drag the corners if the detection is off. Long receipts can be captured as several pages.

## Features

- Scan with automatic edge detection, cropping and perspective correction
- Save merchant, total, category and note for each receipt
- Search and a running total across receipts
- Share the cropped image (email, Files, messages, etc.)
- Everything is stored on the device. Nothing is uploaded.

## Running it

The scanner uses native code, so the app **does not run in Expo Go**. You need a development build.

```bash
npm install

# Option A: build in the cloud with EAS (no Xcode/Android Studio needed)
npx eas-cli@latest build --profile development --platform android   # or ios
npx expo start

# Option B: build locally (needs Xcode or Android Studio)
npm run ios       # or: npm run android
```

Install the development build on your phone, then open it while `npx expo start` is running.

## Project layout

```
App.tsx                 Receipt list, search, totals and the Scan button
src/scanner.ts          Opens the auto-cropping document scanner
src/storage.ts          Saves images to the app's documents folder and metadata to AsyncStorage
src/ReceiptDetail.tsx   View and edit a receipt, share or delete it
src/types.ts            Receipt type and categories
src/theme.ts            Colours
```
