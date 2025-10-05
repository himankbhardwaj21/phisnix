
'use server';

import {
  analyzeQrCodeSafety,
  AnalyzeQrCodeSafetyOutput,
} from '@/ai/flows/analyze-qr-code-safety';
import {
  analyzeWebsiteSafety,
  AnalyzeWebsiteSafetyOutput,
} from '@/ai/flows/analyze-website-safety';
import {
  analyzePaymentLinkSafety,
  AnalyzePaymentLinkOutput,
} from '@/ai/flows/analyze-payment-link-safety';
import { z } from 'zod';
import { initializeAdminApp, getUserIdFromRequest, saveAnalysisResult } from '@/firebase/server-init';
import { headers } from 'next/headers';

const urlSchema = z.string().url({ message: 'Please enter a valid URL.' });
const paymentLinkSchema = z.string().url({ message: 'Please enter a valid payment link URL.' });
const qrCodeSchema = z.string().startsWith('data:image/', { message: 'Invalid QR code image format.' });

export type AnalysisState<T> = {
  data?: T;
  error?: string;
  fieldErrors?: { [key: string]: string[] | undefined };
};

export async function performUrlAnalysis(
  prevState: any,
  formData: FormData
): Promise<AnalysisState<AnalyzeWebsiteSafetyOutput>> {
  const validatedFields = urlSchema.safeParse(formData.get('url'));

  if (!validatedFields.success) {
    return {
      error: 'Invalid URL provided.',
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    const result = await analyzeWebsiteSafety({ url: validatedFields.data });
    const userId = await getUserIdFromRequest(headers());
    if (userId) {
      await saveAnalysisResult('urlAnalysis', { ...result, url: validatedFields.data }, userId);
    }
    return { data: result };
  } catch (e: any) {
    console.error(e);
    return { error: e.message || 'An unexpected error occurred during analysis. Please try again.' };
  }
}

export async function performPaymentAnalysis(
  prevState: any,
  formData: FormData
): Promise<AnalysisState<AnalyzePaymentLinkOutput>> {
  const validatedFields = paymentLinkSchema.safeParse(formData.get('paymentLink'));

  if (!validatedFields.success) {
    return {
      error: 'Invalid Payment Link provided.',
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    const result = await analyzePaymentLinkSafety({ paymentLink: validatedFields.data });
    const userId = await getUserIdFromRequest(headers());
    if (userId) {
      await saveAnalysisResult('paymentAnalysis', { ...result, paymentLink: validatedFields.data }, userId);
    }
    return { data: result };
  } catch (e: any) {
    console.error(e);
    return { error: e.message || 'An unexpected error occurred during analysis. Please try again.' };
  }
}

export async function performQrAnalysis(
  prevState: any,
  formData: FormData
): Promise<AnalysisState<AnalyzeQrCodeSafetyOutput>> {
  const dataUri = formData.get('qrCodeDataUri');
  
  if (!dataUri) {
     return {
      error: 'No QR code provided',
    };
  }

  const validatedFields = qrCodeSchema.safeParse(dataUri);

  if (!validatedFields.success) {
    return {
      error: 'Invalid QR Code data.',
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    const result = await analyzeQrCodeSafety({ qrCodeDataUri: validatedFields.data });
    const userId = await getUserIdFromRequest(headers());
    if(userId) {
        // We need to figure out what the QR code content is to save it.
        // For now, let's assume the AI gives us the content or we decode it separately.
        // Let's assume for now we save the data URI as content
        await saveAnalysisResult('qrCodeAnalysis', { ...result, qrCodeContent: 'Scanned QR' }, userId);
    }

    return { data: { ...result, isSafe: result.safe, reasoning: result.reason } };
  } catch (e: any) {
    console.error(e);
    return { error: e.message || 'An unexpected error occurred during analysis. Please try again.' };
  }
}

export async function updateUserProfile(data: { name: string, phone: string }): Promise<{ error?: string }> {
  try {
    const { app } = initializeAdminApp();
    const auth = app.auth();
    const firestore = app.firestore();
    const userId = await getUserIdFromRequest(headers());

    if (!userId) {
      throw new Error('User not authenticated.');
    }
    
    // Update Firebase Auth
    await auth.updateUser(userId, {
      displayName: data.name,
    });

    // Update Firestore
    const userRef = firestore.collection('users').doc(userId);
    await userRef.update({
      name: data.name,
      phoneNumber: data.phone,
    });

    return {};
  } catch (error: any) {
    console.error('Error updating profile:', error);
    return { error: error.message || 'Failed to update profile.' };
  }
}
