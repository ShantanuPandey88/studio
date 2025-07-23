
"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format, isSameDay, isWeekend } from "date-fns";
import { accommodatePreferredSeating } from "@/ai/flows/accommodate-preferred-seating";
import type { AccommodatePreferredSeatingOutput } from "@/ai/flows/accommodate-preferred-seating";
import type { Booking } from "@/types";
import type { User } from "@/lib/firebase";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { useToast } from "@/hooks/use-toast";

type AiBookingDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  selectedDate: Date | undefined;
  employees: User[];
  onBookDesk: (deskId: string, employeeId: string) => void;
  bookings: Booking[];
};

const FormSchema = z.object({
  employeeId: z.string({
    required_error: "Please select an employee.",
  }),
});

export default function AiBookingDialog({
  isOpen,
  onOpenChange,
  selectedDate,
  employees,
  onBookDesk,
  bookings,
}: AiBookingDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [result, setResult] = React.useState<AccommodatePreferredSeatingOutput | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
  });
  
  const selectedEmployeeId = form.watch("employeeId");
  const selectedEmployee = React.useMemo(() => 
    employees.find(e => e.uid === selectedEmployeeId), 
  [employees, selectedEmployeeId]);


  const handleOpenChange = (open: boolean) => {
    if (!open) {
      form.reset();
      setResult(null);
      setError(null);
      setIsLoading(false);
    }
    onOpenChange(open);
  }

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    if (!selectedDate || !selectedEmployee) {
        setError("Please select a date and an employee.");
        return;
    }
    
    if (isWeekend(selectedDate)) {
      toast({
        variant: "destructive",
        title: "Cannot Book on Weekend",
        description: "Bookings are not allowed on Saturdays or Sundays.",
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await accommodatePreferredSeating({
        employeeName: selectedEmployee.displayName,
        date: format(selectedDate, "yyyy-MM-dd"),
      });
      setResult(response);
    } catch (e) {
      setError("Failed to get AI suggestion. Please try again.");
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }

  const isDeskAlreadyBooked = result && selectedDate 
    ? bookings.some(b => isSameDay(b.date, selectedDate) && b.deskId === result.deskNumber) 
    : false;

  const isEmployeeAlreadyBooked = React.useMemo(() => {
    if (!selectedDate || !selectedEmployee) return false;
    return bookings.some(b => isSameDay(b.date, selectedDate) && b.userId === selectedEmployee.uid);
  }, [bookings, selectedDate, selectedEmployee]);

  const isDateWeekend = selectedDate ? isWeekend(selectedDate) : false;


  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline flex items-center gap-2"><Sparkles className="text-primary"/> AI Smart Booking</DialogTitle>
          <DialogDescription>
            Let our AI find the best available desk for an employee based on their team and preferences.
          </DialogDescription>
        </DialogHeader>
        
        {!result ? (
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                control={form.control}
                name="employeeId"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Employee</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select an employee" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        {employees.map((emp) => (
                            <SelectItem key={emp.uid} value={emp.uid}>
                            {emp.displayName}
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />
                 {error && <p className="text-sm font-medium text-destructive">{error}</p>}
                <DialogFooter>
                    <Button type="submit" disabled={isLoading || !selectedEmployeeId || isDateWeekend}>
                    {isLoading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please wait</>) : "Get Suggestion"}
                    </Button>
                </DialogFooter>
            </form>
            </Form>
        ) : (
            <div className="space-y-4">
                <Card>
                    <CardContent className="p-6">
                        <p className="text-sm text-muted-foreground">Suggested Desk for <span className="font-bold text-foreground">{selectedEmployee?.displayName}</span> on <span className="font-bold text-foreground">{selectedDate ? format(selectedDate, "PPP") : ""}</span></p>
                        <p className="text-4xl font-bold text-primary my-2">{result.deskNumber}</p>
                        <p className="text-sm text-muted-foreground mt-4"><span className="font-semibold">Reasoning:</span> {result.reasoning}</p>
                    </CardContent>
                </Card>
                {isDeskAlreadyBooked && (
                    <Alert variant="destructive">
                        <AlertTitle>Desk Unavailable</AlertTitle>
                        <AlertDescription>This suggested desk is already booked. Please try another day or book manually.</AlertDescription>
                    </Alert>
                )}
                {isEmployeeAlreadyBooked && (
                    <Alert variant="destructive">
                        <AlertTitle>Booking Limit Reached</AlertTitle>
                        <AlertDescription>{selectedEmployee?.displayName} already has a booking for this day.</AlertDescription>
                    </Alert>
                )}
                <DialogFooter className="!justify-between">
                     <Button variant="ghost" onClick={() => setResult(null)}>Try Again</Button>
                     <Button onClick={() => onBookDesk(result.deskNumber, form.getValues("employeeId"))} disabled={isDeskAlreadyBooked || isEmployeeAlreadyBooked || isDateWeekend}>
                        Book this Desk
                    </Button>
                </DialogFooter>
            </div>
        )}

      </DialogContent>
    </Dialog>
  );
}

    
