
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import type { ReadonlyHeaders } from 'next/headers';

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  : undefined;

export function initializeAdminApp() {
  const appName = 'firebase-admin-app-server-actions';
  const existingApp = getApps().find(app => app.name === appName);
  if (existingApp) {
    return { app: existingApp };
  }

  const app = initializeApp({
    credential: cert(serviceAccount),
    databaseURL: `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseio.com`
  }, appName);

  return { app };
}

export async function getUserIdFromRequest(headers: ReadonlyHeaders): Promise<string | null> {
  const authorization = headers.get('Authorization');
  if (authorization?.startsWith('Bearer ')) {
    const idToken = authorization.split('Bearer ')[1];
    try {
      const { app } = initializeAdminApp();
      const decodedToken = await app.auth().verifyIdToken(idToken);
      return decodedToken.uid;
    } catch (error) {
      console.error('Error verifying ID token:', error);
      return null;
    }
  }
  return null;
}

type AnalysisType = 'urlAnalysis' | 'paymentAnalysis' | 'qrCodeAnalysis';

export async function saveAnalysisResult(
  analysisType: AnalysisType,
  data: any,
  userId: string
) {
  try {
    const { app } = initializeAdminApp();
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
