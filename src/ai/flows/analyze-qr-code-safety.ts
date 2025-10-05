'use server';

/**
 * @fileOverview Analyzes QR codes for website safety.
 *
 * - analyzeQrCodeSafety - Analyzes a QR code to determine if the linked website is safe or fraudulent.
 * - AnalyzeQrCodeSafetyInput - The input type for the analyzeQrCodeSafety function.
 * - AnalyzeQrCodeSafetyOutput - The return type for the analyzeQrCodeSafety function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeQrCodeSafetyInputSchema = z.object({
  qrCodeDataUri: z
    .string()
    .describe(
      "A QR code image as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'." // Corrected grammar here
    ),
});
export type AnalyzeQrCodeSafetyInput = z.infer<typeof AnalyzeQrCodeSafetyInputSchema>;

const AnalyzeQrCodeSafetyOutputSchema = z.object({
  safe: z.boolean().describe('Whether the linked website is safe or not.'),
  reason: z.string().describe('The reason for the safety determination.'),
  trustScore: z.number().min(0).max(100).describe('A score from 0 to 100 representing the trust level of the content.')
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
  prompt: `You are an expert in website security and fraud detection. Analyze the website linked in the QR code image to determine if it is safe or potentially fraudulent. Provide a trust score from 0 (very unsafe) to 100 (very safe).

Consider factors such as the website's domain age, SSL certificate, privacy policy, contact information, and user reviews. Also, check if the website is on any blocklists or has been reported for phishing or malware.

Provide a verdict (safe or unsafe), a detailed explanation of your reasoning, and the trust score. Use the following QR code as input: {{media url=qrCodeDataUri}}

Format your output as a JSON object with "safe" (boolean), "reason" (string), and "trustScore" (number) fields.`,
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
