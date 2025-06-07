class FirebaseConfig {
    static get CONFIG() {
        return {
            // TODO: Replace with your Firebase project configuration
            // Get this from Firebase Console > Project Settings > General > Your apps
            apiKey: "AIzaSyAANSKH2OD9SqaDKZBRXSEZ1AGgctv_xUg",
            authDomain: "timekeeper-ai.firebaseapp.com",
            projectId: "timekeeper-ai",
            storageBucket: "timekeeper-ai.firebasestorage.app",
            messagingSenderId: "30896861741",
            appId: "1:30896861741:web:8d64497e09bad850a57ea4"
        };
    }

    static get COLLECTIONS() {
        return {
            TASKS: 'tasks',
            COMPLETIONS: 'completions'
        };
    }

    static get AUTH_SETTINGS() {
        return {
            SINGLE_USER_MODE: true, // Single user - no authentication needed
            OFFLINE_FIRST: true // Prioritize localStorage for reliability
        };
    }

    static initialize() {
        try {
            // Initialize Firebase
            if (!firebase.apps.length) {
                firebase.initializeApp(this.CONFIG);
                console.log('✅ Firebase initialized successfully (single-user mode)');
            }

            // Initialize Firestore
            const db = firebase.firestore();
            
            // Enable offline persistence for better offline support
            db.enablePersistence({ synchronizeTabs: true })
                .then(() => {
                    console.log('✅ Firestore offline persistence enabled');
                })
                .catch((err) => {
                    console.warn('⚠️ Firestore persistence failed:', err);
                    if (err.code === 'failed-precondition') {
                        console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
                    } else if (err.code === 'unimplemented') {
                        console.warn('The current browser does not support persistence.');
                    }
                });

            // No authentication needed for single user
            return { db };
        } catch (error) {
            console.error('❌ Firebase initialization failed:', error);
            throw error;
        }
    }

    static isConfigured() {
        const config = this.CONFIG;
        return config.apiKey !== "your-api-key-here" && 
               config.projectId !== "your-project-id";
    }

    static validateConfig() {
        if (!this.isConfigured()) {
            throw new Error(`
Firebase configuration required! 

Please update js/config/firebase-config.js with your Firebase project settings:

1. Go to Firebase Console (https://console.firebase.google.com)
2. Select your project (or create a new one)
3. Go to Project Settings > General > Your apps
4. Copy the configuration object and replace the placeholder values in firebase-config.js

Required fields:
- apiKey
- authDomain  
- projectId
- storageBucket
- messagingSenderId
- appId
            `);
        }
    }
}

// Global Firebase instances
let firebaseDb = null;

// Initialize Firebase when this script loads
document.addEventListener('DOMContentLoaded', () => {
    try {
        FirebaseConfig.validateConfig();
        const { db } = FirebaseConfig.initialize();
        firebaseDb = db;
        
        // Make available globally for debugging
        if (DebugUtils.isEnabled) {
            window.firebaseDb = db;
        }
    } catch (error) {
        console.error('Firebase initialization failed:', error);
        ErrorHandler.showNotification(
            'Firebase setup required. Check console for details.', 
            'error', 
            10000
        );
    }
});

window.FirebaseConfig = FirebaseConfig;