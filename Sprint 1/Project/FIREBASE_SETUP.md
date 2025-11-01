# Firebase Setup Guide

## 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name (e.g., "medmind-app")
4. Enable Google Analytics (optional)
5. Click "Create project"

## 2. Add Web App to Firebase Project

1. In Firebase console, click the web icon (</>)
2. Register app with nickname (e.g., "MedMind Web")
3. Copy the Firebase configuration object

## 3. Update Firebase Configuration

Replace the placeholder values in `firebase.js` with your actual Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-actual-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-actual-sender-id",
  appId: "your-actual-app-id"
};
```

## 4. Enable Authentication

1. In Firebase console, go to "Authentication"
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable "Email/Password" provider
5. Save changes

## 5. Enable Firestore Database

1. In Firebase console, go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" for development
4. Select a location for your database
5. Click "Done"

## 6. Install Dependencies

The required dependencies are already in package.json:
- `firebase`: Firebase SDK
- `@react-native-firebase/app`: React Native Firebase core
- `@react-native-firebase/auth`: Authentication module

## 7. Test Authentication

1. Run the app: `npm start`
2. Try creating a new account
3. Check Firebase console > Authentication > Users to see registered users
4. Test login/logout functionality

## Security Rules (Optional)

For production, update Firestore security rules in Firebase console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Troubleshooting

- Make sure all Firebase config values are correct
- Check that Authentication and Firestore are enabled in Firebase console
- Verify internet connection for Firebase operations
- Check console logs for detailed error messages