'use server';

/**
 * @fileOverview Analyzes QR codes for website safety.
 *
 * - analyzeQrCodeSafety - Analyzes QR code content to determine if it is safe or fraudulent.
 * - AnalyzeQrCodeSafetyInput - The input type for the analyzeQrCodeSafety function.
 * - AnalyzeQrCodeSafetyOutput - The return type for the analyzeQrCodeSafety function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeQrCodeSafetyInputSchema = z.object({
  qrCodeContent: z
    .string()
    .describe(
      'The decoded content from a QR code, which could be a URL or any other text.'
    ),
});
export type AnalyzeQrCodeSafetyInput = z.infer<typeof AnalyzeQrCodeSafetyInputSchema>;

const AnalyzeQrCodeSafetyOutputSchema = z.object({
  isSafe: z.boolean().describe('Whether the content is considered safe or not.'),
  reasoning: z.string().describe('The reason for the safety determination.'),
  trustScore: z.number().min(0).max(1).describe('A score of 0 if unsafe/suspicious, or 1 if safe.'),
  contentType: z.string().describe('The detected type of content (e.g., URL, Text, UPI Payment).'),
  extractedUrl: z.string().optional().describe('The URL extracted from the content, if any.'),
  payeeName: z.string().optional().describe("The name of the UPI payee, if present."),
  vpa: z.string().optional().describe("The Virtual Payment Address (VPA) of the UPI payee, if present."),
  amount: z.string().optional().describe("The payment amount requested in the UPI link, if present."),
});
export type AnalyzeQrCodeSafetyOutput = z.infer<typeof AnalyzeQrCodeSafetyOutputSchema>;

export async function analyzeQrCodeSafety(
  input: AnalyzeQrCodeSafetyInput
): Promise<AnalyzeQrCodeSafetyOutput> {
  return analyzeQrCodeSafetyFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeQrCodeSafetyPrompt',
  input: {schema: AnalyzeQrCodeSafetyInputSchema},
  output: {schema: AnalyzeQrCodeSafetyOutputSchema},
  prompt: `You are an expert in data security and fraud detection, with special knowledge of the UPI (Unified Payments Interface) used in India. Analyze the following content extracted from a QR code to determine if it is safe or potentially malicious. Provide a trust score of 0 if it is unsafe/suspicious, and 1 if it is safe.

Content: {{{qrCodeContent}}}

Follow these steps:

1.  **Determine Content Type:** First, identify the type of content. Is it a standard URL (http/https), a UPI payment link (upi://), plain text, or something else?

2.  **Handle UPI Links:**
    *   If the content starts with 'upi://pay', recognize it as a **UPI Payment**.
    *   These links are generally safe to open in a payment app, as the user must still authenticate the transaction. Therefore, you should set **isSafe** to **true** and **trustScore** to **1**.
    *   Parse the UPI link to extract key information. The link is a standard URL. The pathname is the VPA. Search for these query parameters:
        *   'pa': The Virtual Payment Address (VPA). Set the 'vpa' output field.
        *   'pn': The Payee Name. Set the 'payeeName' output field.
        *   'am': The transaction amount. Set the 'amount' output field.
    *   For the 'reasoning', explain that it's a valid UPI link and list the extracted payee details for user verification. The main risk is paying the wrong person, so confirming the details is important.

3.  **Handle Standard URLs (http/https):**
    *   If the content is a standard web URL, analyze its safety. Consider domain reputation, SSL, known phishing reports, and suspicious parameters.
    *   Set 'isSafe', 'trustScore', and 'reasoning' based on this web analysis.
    *   Set 'extractedUrl' to this URL.

4.  **Handle Other Content:**
    *   If the content is plain text or other data, analyze it for suspicious characteristics (e.g., scripts, strange commands, socially engineered messages).
    *   Set 'isSafe', 'trustScore', and 'reasoning' accordingly.

Format your output as a JSON object.`,
});

const analyzeQrCodeSafetyFlow = ai.defineFlow(
  {
    name: 'analyzeQrCodeSafetyFlow',
    inputSchema: AnalyzeQrCodeSafetyInputSchema,
    outputSchema: AnalyzeQrCodeSafetyOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
