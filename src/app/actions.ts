
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

const urlSchema = z.string().url({ message: 'Please enter a valid URL.' });
const paymentLinkSchema = z.string().url({ message: 'Please enter a valid payment link URL.' });
const qrContentSchema = z.string().min(1, { message: 'QR code content cannot be empty.'});


export type AnalysisState<T> = {
  data?: T;
  error?: string;
  fieldErrors?: { [key: string]: string[] | undefined };
};

const ensureProtocol = (url: string) => {
    if (!/^(https?:\/\/)/i.test(url)) {
        return `https://${url}`;
    }
    return url;
};

export async function performUrlAnalysis(
  prevState: any,
  formData: FormData
): Promise<AnalysisState<AnalyzeWebsiteSafetyOutput>> {
  const rawUrl = formData.get('url') as string;
  if (!rawUrl) {
    return {
        error: 'Invalid URL provided.',
        fieldErrors: { url: ['Please enter a URL.'] },
    };
  }
  const urlWithProtocol = ensureProtocol(rawUrl);

  const validatedFields = urlSchema.safeParse(urlWithProtocol);

  if (!validatedFields.success) {
    return {
      error: 'Invalid URL provided.',
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    const result = await analyzeWebsiteSafety({ url: validatedFields.data });
    return { data: { ...result, url: validatedFields.data } };
  } catch (e: any) {
    console.error(e);
    return { error: e.message || 'An unexpected error occurred during analysis. Please try again.' };
  }
}

export async function performPaymentAnalysis(
  prevState: any,
  formData: FormData
): Promise<AnalysisState<AnalyzeWebsiteSafetyOutput>> {
  const rawPaymentLink = formData.get('paymentLink') as string;

  if (!rawPaymentLink) {
    return {
        error: 'Invalid Payment Link provided.',
        fieldErrors: { paymentLink: ['Please enter a payment link.'] },
    };
  }

  const paymentLinkWithProtocol = ensureProtocol(rawPaymentLink);
  const validatedFields = paymentLinkSchema.safeParse(paymentLinkWithProtocol);


  if (!validatedFields.success) {
    return {
      error: 'Invalid Payment Link provided.',
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    const result = await analyzeWebsiteSafety({ url: validatedFields.data });
    return { data: { ...result, url: validatedFields.data } };
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
    return { data: result };
  } catch (e: any) {
    console.error(e);
    return { error: e.message || 'An unexpected error occurred during analysis. Please try again.' };
  }
}
