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
      "The decoded content from a QR code, which could be a URL or any other text."
    ),
});
export type AnalyzeQrCodeSafetyInput = z.infer<typeof AnalyzeQrCodeSafetyInputSchema>;

const AnalyzeQrCodeSafetyOutputSchema = z.object({
  isSafe: z.boolean().describe('Whether the content is considered safe or not.'),
  reasoning: z.string().describe('The reason for the safety determination.'),
  trustScore: z.number().min(0).max(1).describe('A score of 0 if unsafe/suspicious, or 1 if safe.'),
  contentType: z.string().describe('The detected type of content (e.g., URL, Text, Contact Card).'),
  extractedUrl: z.string().optional().describe('The URL extracted from the content, if any.'),
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
  prompt: `You are an expert in data security and fraud detection. Analyze the following content extracted from a QR code to determine if it is safe or potentially malicious. Provide a trust score of 0 if it is unsafe/suspicious, and 1 if it is safe.

Content: {{{qrCodeContent}}}

1.  First, determine the type of content (e.g., URL, Plain Text, vCard, WiFi credentials).
2.  If the content is a URL, analyze its safety. Consider factors such as the domain's reputation, SSL certificate, known phishing or malware reports, and suspicious parameters. Set 'extractedUrl' to this URL.
3.  If the content is plain text or other data, analyze it for any suspicious characteristics. For example, does it contain unusual commands, scripts, or socially engineered messages?
4.  Provide a clear verdict ('isSafe'), a detailed 'reasoning' for your conclusion, a 'trustScore' (0 for unsafe, 1 for safe), and the detected 'contentType'.

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
