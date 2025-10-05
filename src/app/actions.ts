
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
    return { data: result };
  } catch (e) {
    console.error(e);
    return { error: 'An unexpected error occurred during analysis. Please try again.' };
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
    return { data: result };
  } catch (e) {
    console.error(e);
    return { error: 'An unexpected error occurred during analysis. Please try again.' };
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
    // Map the 'safe' and 'reason' fields to 'isSafe' and 'reasoning' for consistency
    return { data: { ...result, isSafe: result.safe, reasoning: result.reason } };
  } catch (e) {
    console.error(e);
    return { error: 'An unexpected error occurred during analysis. Please try again.' };
  }
}
