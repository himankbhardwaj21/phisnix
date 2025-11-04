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
  reasoning: z.string().describe('A detailed explanation for the safety determination, outlining the factors considered.'),
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

Follow these steps meticulously and provide detailed reasoning for your verdict:

1.  **Determine Content Type:** First, identify the type of content. Is it a standard URL (http/https), a UPI payment link (upi://), plain text, or something else? Set the 'contentType' field accordingly.

2.  **Handle UPI Links:**
    *   If the content starts with 'upi://pay', recognize it as a **UPI Payment**.
    *   These links are generally safe to open in a payment app because the user must still authenticate the transaction with a PIN. Therefore, you should set **isSafe** to **true** and **trustScore** to **1**.
    *   Parse the UPI link to extract key information. The link is a standard URL. The pathname is the VPA. Search for these query parameters:
        *   'pa': The Virtual Payment Address (VPA). Set the 'vpa' output field.
        *   'pn': The Payee Name. Set the 'payeeName' output field.
        *   'am': The transaction amount. Set the 'amount' output field.
    *   For the 'reasoning', provide a detailed explanation. State that it's a valid UPI link, which is a secure payment protocol. Explain that the primary risk is not the link itself, but paying the wrong person or an incorrect amount. Emphasize that the user MUST verify the extracted payee name, VPA, and amount in their UPI app before entering their PIN.

3.  **Handle Standard URLs (http/https):**
    *   If the content is a standard web URL, perform a thorough safety analysis. Your reasoning must be detailed.
    *   Consider and mention the following factors in your reasoning:
        *   **Domain Reputation:** Does the domain seem legitimate (e.g., 'google.com') or suspicious (e.g., 'g00gle-login.com')?
        *   **SSL/TLS:** Does the URL use HTTPS? Mention that while HTTPS is good, it doesn't guarantee safety.
        *   **Subdomains & Path:** Look for suspicious keywords like 'login', 'secure', 'account', 'update' in unusual places.
        *   **Urgency/Scare Tactics:** Does the URL path suggest urgency (e.g., 'your-account-is-suspended')?
    *   Set 'isSafe' and 'trustScore' based on this analysis. For example, a shortened URL from a trusted source might be safe, but a non-HTTPS URL with a suspicious domain should be unsafe.
    *   Set 'extractedUrl' to this URL.

4.  **Handle Other Content:**
    *   If the content is plain text, a phone number, or other data, analyze it for suspicious characteristics.
    *   For the 'reasoning', explain what the content is (e.g., "This is plain text containing a contact number."). Generally, plain text is safe, so set 'isSafe' to true and 'trustScore' to 1 unless it contains something that looks like a script or a socially engineered message (e.g., "You've won a prize! Call this number now!").
    *   If it's just text or a number, explain that the content itself is not inherently dangerous, but the user should be cautious about how they use it.

Format your output as a JSON object. Your reasoning must be comprehensive and justify your verdict clearly.`,
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
