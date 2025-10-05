
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  : undefined;

export function initializeAdminApp() {
  const appName = 'firebase-admin-app-server-actions';
  const existingApp = getApps().find(app => app.name === appName);
  if (existingApp) {
    return { app: existingApp };
  }

  // Do not attempt to initialize if service account is not available
  if (!serviceAccount) {
    // This is not a hard error, as some actions might not need the admin app.
    // Functions that do need it should handle the 'null' app case.
    const mockApp = {
        auth: () => ({ verifyIdToken: async () => null, updateUser: async () => {} }),
        firestore: () => ({ collection: () => ({ doc: () => ({ collection: () => ({ add: async () => {} }), update: async () => {} }) }) })
    };
    // @ts-ignore
    return { app: mockApp as App };
  }

  const app = initializeApp({
    credential: cert(serviceAccount),
    databaseURL: `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseio.com`
  }, appName);

  return { app };
}

export async function getUserIdFromRequest(idToken: string | null): Promise<string | null> {
  if (!idToken) {
    return null;
  }
  try {
    const { app } = initializeAdminApp();
    if (!app.auth) return null; // Handle case where admin app failed to initialize
    const decodedToken = await app.auth().verifyIdToken(idToken);
    return decodedToken.uid;
  } catch (error) {
    console.error('Error verifying ID token:', error);
    return null;
  }
}

type AnalysisType = 'urlAnalysis' | 'paymentAnalysis' | 'qrCodeAnalysis';

export async function saveAnalysisResult(
  analysisType: AnalysisType,
  data: any,
  userId: string
) {
  try {
    const { app } = initializeAdminApp();
    if (!app.firestore) throw new Error('Admin App not initialized.');
    const firestore = app.firestore();
    
    const analysisData = {
      ...data,
      userId: userId,
      analysisDate: new Date().toISOString(),
    };

    const collectionRef = firestore.collection('users').doc(userId).collection(analysisType);
    await collectionRef.add(analysisData);
  } catch (error) {
    console.error(`Error saving ${analysisType} result:`, error);
    throw new Error(`Failed to save analysis result.`);
  }
}
