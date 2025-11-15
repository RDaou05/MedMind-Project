# Firebase Setup Instructions

## 1. Install Dependencies
Run in the Project directory:
```bash
npm install firebase @react-native-firebase/app @react-native-firebase/auth @react-native-firebase/firestore @react-native-firebase/messaging
```

## 2. Firebase Console Setup
1. Create project at https://console.firebase.google.com/
2. Add Android/iOS apps with bundle IDs from app.json
3. Download config files:
   - `google-services.json` (Android)
   - `GoogleService-Info.plist` (iOS)

## 3. Enable Services
In Firebase Console:
- Authentication > Sign-in method > Email/Password
- Firestore Database > Create database (test mode initially)
- Cloud Messaging > Enable

## 4. Security Rules (Firestore)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      match /medications/{medicationId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```