
'use server';

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
import {ai} from '@/ai/genkit';
import {z} from 'zod';
import {
  getBookings,
  getDesks,
  getUsers,
  Unsubscribe,
} from '@/lib/firestore-adapter';
import {initializeAdminApp} from '@/lib/firebase-admin';
import {User} from '@/lib/firebase';
import {Booking} from '@/types';
import {isSameDay} from 'date-fns';

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

// Tool to get an employee's team
const getEmployeeTeam = ai.defineTool(
  {
    name: 'getEmployeeTeam',
    description: "Get the team of a given employee by the employee's name.",
    inputSchema: z.object({employeeName: z.string()}),
    outputSchema: z.array(z.string()),
  },
  async input => {
    console.log(`Getting team for ${input.employeeName}`);
    const {db} = await initializeAdminApp();
    const users = await getUsers(db);
    const employee = users.find(u => u.displayName === input.employeeName);
    if (!employee || !employee.team) return [];
    return users
      .filter(u => u.team === employee.team && u.uid !== employee.uid)
      .map(u => u.displayName);
  }
);

// Tool to get past seating for an employee
const getPastSeatingForEmployee = ai.defineTool(
  {
    name: 'getPastSeatingForEmployee',
    description: "Get past desk bookings for a given employee by name.",
    inputSchema: z.object({employeeName: z.string()}),
    outputSchema: z.array(z.string()),
  },
  async input => {
    console.log(`Getting past seating for ${input.employeeName}`);
    const {db} = await initializeAdminApp();
    const bookings: Booking[] = [];
    const bookingsSnapshot = await db.collection('bookings').get();
    bookingsSnapshot.forEach(doc => {
      const data = doc.data();
      bookings.push({
        id: doc.id,
        ...data,
        date: (data.date as FirebaseFirestore.Timestamp).toDate(),
      } as Booking);
    });
    return bookings
      .filter(b => b.userName === input.employeeName)
      .map(b => b.deskId);
  }
);

// Tool to get available desks for a date
const getAvailableDesksForDate = ai.defineTool(
  {
    name: 'getAvailableDesksForDate',
    description: 'Get a list of all available (unbooked) desks for a specific date.',
    inputSchema: z.object({date: z.string().describe("The date in YYYY-MM-DD format.")}),
    outputSchema: z.array(z.string()),
  },
  async input => {
      console.log(`Getting available desks for ${input.date}`);
      const {db} = await initializeAdminApp();
      const desksSnapshot = await db.collection('desks').get();
      const allDeskIds = desksSnapshot.docs.map(doc => doc.id);

      const bookings: Booking[] = [];
      const bookingsSnapshot = await db.collection('bookings').get();
      bookingsSnapshot.forEach(doc => {
          const data = doc.data();
          bookings.push({
              id: doc.id,
              ...data,
              date: (data.date as FirebaseFirestore.Timestamp).toDate(),
          } as Booking);
      });
      
      const selectedDate = new Date(input.date);
      const bookedDeskIds = bookings
          .filter(b => isSameDay(b.date, selectedDate))
          .map(b => b.deskId);

      return allDeskIds.filter(id => !bookedDeskIds.includes(id));
  }
);


const prompt = ai.definePrompt({
  name: 'accommodatePreferredSeatingPrompt',
  input: {schema: AccommodatePreferredSeatingInputSchema},
  output: {schema: AccommodatePreferredSeatingOutputSchema},
  tools: [getEmployeeTeam, getPastSeatingForEmployee, getAvailableDesksForDate],
  prompt: `You are an AI assistant that suggests desk assignments for employees, taking into account their team affiliation and seating preferences. Given the employee's name and booking date, you will:

  1.  Use the getAvailableDesksForDate tool to find out which desks are free on the given date.
  2.  Use the getEmployeeTeam tool to identify the employee's team members.
  3.  Use the getPastSeatingForEmployee tool to retrieve the employee's past seating preferences, if any.
  4.  Analyze the information to suggest an available desk that is near the employee's team members or in their preferred location. Consider desk availability for the given date as the highest priority.
  5.  Provide a clear reasoning for your final desk suggestion.

  Employee Name: {{{employeeName}}}
  Date: {{{date}}}
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

export async function accommodatePreferredSeating(
  input: AccommodatePreferredSeatingInput
): Promise<AccommodatePreferredSeatingOutput> {
  return accommodatePreferredSeatingFlow(input);
}
