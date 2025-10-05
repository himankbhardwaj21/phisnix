
'use server';

import {
  analyzeQrCodeSafety,
  AnalyzeQrCodeSafetyOutput,
} from '@/ai/flows/analyze-qr-code-safety';
import {
  analyzeWebsiteSafety,
  AnalyzeWebsiteSafetyOutput,
} from '@/ai/flows/analyze-website-safety';
import { z } from 'zod';
import { initializeAdminApp, getUserIdFromRequest, saveAnalysisResult } from '@/firebase/server-init';

const urlSchema = z.string().url({ message: 'Please enter a valid URL.' });
const paymentLinkSchema = z.string().url({ message: 'Please enter a valid payment link URL.' });
const qrContentSchema = z.string().min(1, { message: 'QR code content cannot be empty.'});


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
  const idToken = formData.get('idToken') as string | null;


  if (!validatedFields.success) {
    return {
      error: 'Invalid URL provided.',
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    const result = await analyzeWebsiteSafety({ url: validatedFields.data });
    const userId = await getUserIdFromRequest(idToken);
    if (userId) {
      await saveAnalysisResult('urlAnalysis', { ...result, url: validatedFields.data, isSafe: result.isSafe, trustScore: result.trustScore, analysisDate: new Date().toISOString() }, userId);
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
): Promise<AnalysisState<AnalyzeWebsiteSafetyOutput>> {
  const validatedFields = paymentLinkSchema.safeParse(formData.get('paymentLink'));
  const idToken = formData.get('idToken') as string | null;

  if (!validatedFields.success) {
    return {
      error: 'Invalid Payment Link provided.',
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    // Re-use the more general website safety analysis for payment links
    const result = await analyzeWebsiteSafety({ url: validatedFields.data });
    const userId = await getUserIdFromRequest(idToken);
    if (userId) {
      // Save it under paymentAnalysis collection for semantic separation
      await saveAnalysisResult('paymentAnalysis', { ...result, paymentLink: validatedFields.data, isSafe: result.isSafe, trustScore: result.trustScore, analysisDate: new Date().toISOString() }, userId);
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
  const qrContent = formData.get('qrCodeContent');
  const idToken = formData.get('idToken') as string | null;
  
  if (!qrContent) {
     return {
      error: 'No QR code content provided',
    };
  }

  const validatedFields = qrContentSchema.safeParse(qrContent);

  if (!validatedFields.success) {
    return {
      error: 'Invalid QR Code data.',
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    const result = await analyzeQrCodeSafety({ qrCodeContent: validatedFields.data });
    const userId = await getUserIdFromRequest(idToken);
    if(userId) {
        await saveAnalysisResult('qrCodeAnalysis', { ...result, qrCodeContent: validatedFields.data, isSafe: result.isSafe, trustScore: result.trustScore, analysisDate: new Date().toISOString() }, userId);
    }

    return { data: result };
  } catch (e: any) {
    console.error(e);
    return { error: e.message || 'An unexpected error occurred during analysis. Please try again.' };
  }
}
