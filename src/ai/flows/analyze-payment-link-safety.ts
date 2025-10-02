'use server';
/**
 * @fileOverview This file contains a Genkit flow for analyzing the safety of a payment gateway link.
 *
 * The flow takes a payment gateway link as input and returns a safety assessment with reasoning.
 * - analyzePaymentLinkSafety - A function that handles the payment link analysis process.
 * - AnalyzePaymentLinkInput - The input type for the analyzePaymentLinkSafety function.
 * - AnalyzePaymentLinkOutput - The return type for the analyzePaymentLinkSafety function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzePaymentLinkInputSchema = z.object({
  paymentLink: z
    .string()
    .url()
    .describe('The payment gateway link to analyze.'),
});
export type AnalyzePaymentLinkInput = z.infer<typeof AnalyzePaymentLinkInputSchema>;

const AnalyzePaymentLinkOutputSchema = z.object({
  isSafe: z.boolean().describe('Whether the payment link is safe or not.'),
  reasoning: z
    .string()
    .describe('The reasoning behind the safety assessment.'),
});
export type AnalyzePaymentLinkOutput = z.infer<typeof AnalyzePaymentLinkOutputSchema>;

export async function analyzePaymentLinkSafety(
  input: AnalyzePaymentLinkInput
): Promise<AnalyzePaymentLinkOutput> {
  return analyzePaymentLinkSafetyFlow(input);
}

const analyzePaymentLinkPrompt = ai.definePrompt({
  name: 'analyzePaymentLinkPrompt',
  input: {schema: AnalyzePaymentLinkInputSchema},
  output: {schema: AnalyzePaymentLinkOutputSchema},
  prompt: `You are an expert in online payment security. Analyze the provided payment gateway link and determine if it is safe or potentially fraudulent. Provide a clear explanation of your reasoning.

Payment Link: {{{paymentLink}}}

Consider factors such as the domain, SSL certificate, reputation, and any suspicious patterns or redirects.  Assess the likelihood of phishing or other malicious activity.

Output your result as a JSON object with "isSafe" and "reasoning" fields.  The reasoning should be detailed and explain how you came to your conclusion.`,
});

const analyzePaymentLinkSafetyFlow = ai.defineFlow(
  {
    name: 'analyzePaymentLinkSafetyFlow',
    inputSchema: AnalyzePaymentLinkInputSchema,
    outputSchema: AnalyzePaymentLinkOutputSchema,
  },
  async input => {
    const {output} = await analyzePaymentLinkPrompt(input);
    return output!;
  }
);
