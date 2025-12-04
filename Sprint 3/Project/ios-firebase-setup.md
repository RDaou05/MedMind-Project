# iOS Firebase Setup

## 1. Firebase Console
1. Go to Firebase Console > Project Settings
2. Click "Add app" > iOS
3. Enter bundle ID: `com.medmind.app`
4. Download `GoogleService-Info.plist`

## 2. Add Config File
Place `GoogleService-Info.plist` in Project root directory

## 3. Update app.json
```json
{
  "expo": {
    "plugins": [
      "@react-native-firebase/app"
    ],
    "ios": {
      "googleServicesFile": "./GoogleService-Info.plist"
    }
  }
}
```

## 4. Install Firebase Plugin
```bash
npx expo install @react-native-firebase/app
```

## 5. Build
```bash
eas build --platform ios
```