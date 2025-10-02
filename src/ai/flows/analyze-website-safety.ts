'use server';

/**
 * @fileOverview This file defines a Genkit flow for analyzing website safety.
 *
 * - analyzeWebsiteSafety - An asynchronous function that takes a URL as input and returns a safety verdict with reasoning.
 * - AnalyzeWebsiteSafetyInput - The input type for the analyzeWebsiteSafety function (a URL string).
 * - AnalyzeWebsiteSafetyOutput - The output type for the analyzeWebsiteSafety function, including a safety verdict and reasoning.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeWebsiteSafetyInputSchema = z.object({
  url: z.string().describe('The URL to analyze for safety.'),
});
export type AnalyzeWebsiteSafetyInput = z.infer<typeof AnalyzeWebsiteSafetyInputSchema>;

const AnalyzeWebsiteSafetyOutputSchema = z.object({
  isSafe: z.boolean().describe('Whether the website is safe or not.'),
  reasoning: z.string().describe('The reasoning behind the safety verdict.'),
});
export type AnalyzeWebsiteSafetyOutput = z.infer<typeof AnalyzeWebsiteSafetyOutputSchema>;

export async function analyzeWebsiteSafety(input: AnalyzeWebsiteSafetyInput): Promise<AnalyzeWebsiteSafetyOutput> {
  return analyzeWebsiteSafetyFlow(input);
}

const analyzeWebsiteSafetyPrompt = ai.definePrompt({
  name: 'analyzeWebsiteSafetyPrompt',
  input: {schema: AnalyzeWebsiteSafetyInputSchema},
  output: {schema: AnalyzeWebsiteSafetyOutputSchema},
  prompt: `You are an expert in website security and fraud detection. Your task is to analyze the safety of a given URL and provide a verdict with clear reasoning.

Analyze the following URL:
{{{url}}}

Consider factors such as:
- Domain age and registration information
- Presence of SSL certificate
- Website content and design (look for suspicious elements)
- User reviews and reputation
- Known phishing or malware reports

Based on your analysis, determine if the website is safe or potentially fraudulent. Provide a concise explanation for your verdict.

Output should be structured as a JSON object that conforms to AnalyzeWebsiteSafetyOutputSchema. Make sure to set isSafe to true if safe, and false if unsafe. The reasoning field should contain the bulk of your analysis. Do not include any preamble or postamble in your response.`,
});

const analyzeWebsiteSafetyFlow = ai.defineFlow(
  {
    name: 'analyzeWebsiteSafetyFlow',
    inputSchema: AnalyzeWebsiteSafetyInputSchema,
    outputSchema: AnalyzeWebsiteSafetyOutputSchema,
  },
  async input => {
    const {output} = await analyzeWebsiteSafetyPrompt(input);
    return output!;
  }
);
