import admin from 'firebase-admin';

// Initialize Firebase Admin with a robust singleton pattern
function getAdminApp() {
    if (!admin.apps.length) {
        // Check if we have the necessary credentials
        const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
        const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
        const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

        if (!privateKey || !clientEmail || !projectId) {
            console.warn('Firebase Admin credentials not fully provided. Skipping initialization for now.');
            return null;
        }

        try {
            return admin.initializeApp({
                credential: admin.credential.cert({
                    projectId,
                    clientEmail,
                    privateKey: privateKey.replace(/\\n/g, '\n'),
                }),
            });
        } catch (error) {
            console.error('Firebase admin initialization error', error);
            return null;
        }
    }
    return admin.app();
}

const app = getAdminApp();

export const adminAuth = app ? app.auth() : null as any;
export const adminDb = app ? app.firestore() : null as any;
