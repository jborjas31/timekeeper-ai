# Firebase Setup Instructions for TimeKeeper

This guide will help you set up Firebase/Firestore for your TimeKeeper app to replace localStorage with cloud storage.

## Prerequisites

- A Google account
- Basic understanding of web development

## Step 1: Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com)
2. Click "Create a project" or "Add project"
3. Enter your project name (e.g., "timekeeper-app")
4. Choose whether to enable Google Analytics (optional)
5. Click "Create project"

## Step 2: Set Up Firestore Database

1. In your Firebase project console, click "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in test mode" (for development) or "Start in production mode" (for production)
4. Select a location for your database (choose the one closest to your users)
5. Click "Done"

## Step 3: Enable Authentication

1. In your Firebase project console, click "Authentication" in the left sidebar
2. Click "Get started"
3. Go to the "Sign-in method" tab
4. Enable the authentication methods you want:
   - **Anonymous**: Enable this for automatic user creation
   - **Email/Password**: Enable this for permanent accounts
   - You can add more methods later (Google, Facebook, etc.)

## Step 4: Configure Web App

1. In your Firebase project console, click the gear icon (Project settings)
2. Scroll down to "Your apps" section
3. Click the web icon (`</>`) to add a web app
4. Enter an app nickname (e.g., "TimeKeeper Web")
5. Choose whether to set up Firebase Hosting (optional)
6. Click "Register app"
7. Copy the configuration object (it looks like this):

```javascript
const firebaseConfig = {
  apiKey: "your-api-key-here",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

## Step 5: Update Your TimeKeeper Configuration

1. Open `js/config/firebase-config.js` in your TimeKeeper project
2. Replace the placeholder configuration with your actual Firebase config:

```javascript
static get CONFIG() {
    return {
        apiKey: "your-actual-api-key",
        authDomain: "your-project-id.firebaseapp.com", 
        projectId: "your-actual-project-id",
        storageBucket: "your-project-id.appspot.com",
        messagingSenderId: "your-actual-sender-id",
        appId: "your-actual-app-id"
    };
}
```

## Step 6: Set Up Firestore Security Rules (Optional but Recommended)

1. In your Firebase project console, go to "Firestore Database"
2. Click on the "Rules" tab
3. Replace the default rules with these secure rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

4. Click "Publish"

## Step 7: Test Your Setup

1. Open your TimeKeeper app in a web browser
2. Open the browser's developer console (F12)
3. Look for these success messages:
   - "✅ Firebase initialized successfully"
   - "✅ Firestore offline persistence enabled"
   - "👤 Signed in anonymously: [user-id]"

4. Try adding a task - you should see:
   - "✅ Tasks saved to Firestore"

## Features Enabled

With Firebase/Firestore integration, your TimeKeeper app now has:

### ✅ **Cloud Storage**
- Tasks and completions are saved to Firestore
- Data persists across devices and browsers
- Automatic backup to localStorage as fallback

### ✅ **Real-time Sync**
- Changes sync instantly across all open tabs/devices
- Offline support with automatic sync when back online
- Conflict resolution for simultaneous edits

### ✅ **User Authentication**
- Anonymous users are created automatically
- Users can upgrade to permanent accounts
- Email/password authentication
- Secure data isolation per user

### ✅ **Offline Support**
- App works offline with local caching
- Changes queue for sync when connection returns
- Seamless online/offline transitions

## Authentication Features

### Anonymous Users
- Created automatically on first visit
- Data is saved but tied to the anonymous account
- Can be upgraded to permanent accounts

### Account Creation
- Click "Create Account" in the top-right auth widget
- Convert anonymous account to permanent account
- All existing data is preserved

### Sign In/Out
- Use the auth widget in the top-right corner
- Sign in with email/password
- Sign out to switch accounts

## Troubleshooting

### "Firebase configuration required" Error
- Make sure you've updated `js/config/firebase-config.js` with your actual Firebase config
- Check that all fields are filled in correctly

### "Permission denied" Errors
- Verify your Firestore security rules are set up correctly
- Make sure authentication is working (check for user ID in console)

### Data Not Syncing
- Check your internet connection
- Look for error messages in the browser console
- Verify your Firebase project is active and billing is set up if needed

### Migration from localStorage
- Existing localStorage data will be automatically migrated to Firestore on first load
- The app maintains localStorage as a backup

## Production Considerations

### Security Rules
- Review and customize Firestore security rules for your use case
- Consider adding additional validation rules

### Billing
- Firebase has a generous free tier
- Monitor usage in the Firebase console
- Set up billing alerts if needed

### Performance
- Consider adding indexes for complex queries (none needed for basic TimeKeeper)
- Monitor Firestore usage and optimize if needed

## Support

If you encounter issues:

1. Check the browser console for error messages
2. Verify your Firebase configuration
3. Test with a fresh browser session/incognito mode
4. Check Firebase project status and quotas

## Optional Enhancements

### Add Google Sign-In
1. Enable Google authentication in Firebase Console
2. Add Google Sign-In button to the auth UI
3. Update authentication flow

### Enable Push Notifications
1. Add Firebase Messaging to the project
2. Set up service worker for notifications
3. Add notification scheduling features

### Add Data Export/Import
1. Create functions to export user data
2. Add import functionality for data migration
3. Consider backup strategies