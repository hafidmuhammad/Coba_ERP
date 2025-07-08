// This file is machine-generated - edit at your own risk!

'use server';

/**
 * @fileOverview Generates business insights from revenue and expense data.
 *
 * - generateBusinessInsights - A function that generates business insights.
 * - GenerateBusinessInsightsInput - The input type for the generateBusinessInsights function.
 * - GenerateBusinessInsightsOutput - The return type for the generateBusinessInsights function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateBusinessInsightsInputSchema = z.object({
  revenueData: z
    .string()
    .describe('A string containing the revenue records.'),
  expenseData: z
    .string()
    .describe('A string containing the expense records.'),
});
export type GenerateBusinessInsightsInput = z.infer<
  typeof GenerateBusinessInsightsInputSchema
>;

const GenerateBusinessInsightsOutputSchema = z.object({
  insights: z.string().describe('Generated business insights and trends.'),
  recommendations: z
    .string()
    .describe('Actionable recommendations based on the insights.'),
});
export type GenerateBusinessInsightsOutput = z.infer<
  typeof GenerateBusinessInsightsOutputSchema
>;

export async function generateBusinessInsights(
  input: GenerateBusinessInsightsInput
): Promise<GenerateBusinessInsightsOutput> {
  return generateBusinessInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateBusinessInsightsPrompt',
  input: {schema: GenerateBusinessInsightsInputSchema},
  output: {schema: GenerateBusinessInsightsOutputSchema},
  prompt: `You are a business intelligence expert. Analyze the provided revenue and expense data to identify key trends, patterns, and anomalies. Provide actionable recommendations to improve profitability and efficiency.\n\nRevenue Data: {{{revenueData}}}\nExpense Data: {{{expenseData}}}\n\nAnalyze the data and provide business insights. What are the key trends and patterns in revenue and expenses? What are the major drivers of profitability? Are there any areas of concern that need to be addressed?\nBased on your analysis, what are your top 3 recommendations for improving the business's financial performance? Be specific and actionable.`,
});

const generateBusinessInsightsFlow = ai.defineFlow(
  {
    name: 'generateBusinessInsightsFlow',
    inputSchema: GenerateBusinessInsightsInputSchema,
    outputSchema: GenerateBusinessInsightsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
