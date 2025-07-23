// 'use server';

/**
 * @fileOverview Implements the AccommodatePreferredSeating flow.
 *
 * This flow takes an employee's name and a date as input, retrieves the
 * employee's team and past seating preferences, and suggests an available desk
 * that accommodates these preferences. It prioritizes seating the employee near
 * their team members and in their preferred location, if available.
 *
 * - accommodatePreferredSeating - The main function to trigger the flow.
 * - AccommodatePreferredSeatingInput - The input type for the function.
 * - AccommodatePreferredSeatingOutput - The output type for the function.
 */

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AccommodatePreferredSeatingInputSchema = z.object({
  employeeName: z
    .string()
    .describe('The name of the employee requesting a desk.'),
  date: z.string().describe('The date for which the desk is being booked.'),
});
export type AccommodatePreferredSeatingInput = z.infer<
  typeof AccommodatePreferredSeatingInputSchema
>;

const AccommodatePreferredSeatingOutputSchema = z.object({
  deskNumber: z
    .string()
    .describe(
      'The recommended desk number that accommodates the employees preferences.'
    ),
  reasoning: z
    .string()
    .describe(
      'The reasoning behind the desk assignment, including team proximity and past preferences.'
    ),
});
export type AccommodatePreferredSeatingOutput = z.infer<
  typeof AccommodatePreferredSeatingOutputSchema
>;

export async function accommodatePreferredSeating(
  input: AccommodatePreferredSeatingInput
): Promise<AccommodatePreferredSeatingOutput> {
  return accommodatePreferredSeatingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'accommodatePreferredSeatingPrompt',
  input: {schema: AccommodatePreferredSeatingInputSchema},
  output: {schema: AccommodatePreferredSeatingOutputSchema},
  prompt: `You are an AI assistant that suggests desk assignments for employees,
  taking into account their team affiliation and seating preferences. Given the
  employee's name and booking date, you will:

  1.  Identify the employee's team members.
  2.  Retrieve the employee's past seating preferences, if any.
  3.  Suggest an available desk that is near the employee's team members or in
      their preferred location. Consider desk availability for the given date.

  Employee Name: {{{employeeName}}}
  Date: {{{date}}}

  Return the desk number and your reasoning for the assignment.
  `,
});

const accommodatePreferredSeatingFlow = ai.defineFlow(
  {
    name: 'accommodatePreferredSeatingFlow',
    inputSchema: AccommodatePreferredSeatingInputSchema,
    outputSchema: AccommodatePreferredSeatingOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
