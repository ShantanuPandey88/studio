
"use client"

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { getHolidays, type Unsubscribe } from "@/lib/firestore-adapter";
import { addHoliday, deleteHoliday } from "@/lib/actions";
import type { Holiday } from "@/types";
import { cn } from "@/lib/utils";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/context/AuthContext";

const formSchema = z.object({
  date: z.date({ required_error: "A date is required." }),
  name: z.string().min(3, "Name must be at least 3 characters."),
});

export function DateManagement() {
  const [holidays, setHolidays] = React.useState<Holiday[]>([]);
  const { toast } = useToast();
  const { user, db } = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      date: undefined,
    },
  });

  React.useEffect(() => {
    if (!user || !db) return; // Wait for user to be authenticated
    const unsubscribe = getHolidays(db, setHolidays);
    return () => unsubscribe();
  }, [user, db]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
        await addHoliday(values);
        toast({
            title: "Holiday Added",
            description: `${values.name} on ${format(values.date, "PPP")} is now a non-bookable day.`,
        });
        form.reset();
    } catch(e: any) {
        toast({
            variant: "destructive",
            title: "Error",
            description: e.message || "This date may already be set as a holiday.",
        });
    }
  }

  const handleRemoveHoliday = async (holidayId: string) => {
    try {
        await deleteHoliday(holidayId);
        toast({
            title: "Holiday Removed",
            description: `The holiday has been removed and the date is now bookable.`,
        });
    } catch(e) {
         toast({
            variant: "destructive",
            title: "Error",
            description: "Could not remove the holiday.",
        });
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Add Non-Bookable Date</CardTitle>
          <CardDescription>Add a public holiday or other non-bookable dates.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Holiday Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Diwali" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-[240px] pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">Add Date</Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Current Non-Bookable Dates</CardTitle>
          <CardDescription>List of all configured public holidays.</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-72">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                </TableHeader>
              <TableBody>
                {holidays.map((holiday) => (
                  <TableRow key={holiday.id}>
                    <TableCell>{format(holiday.date, "PPP")}</TableCell>
                    <TableCell>{holiday.name}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveHoliday(holiday.id)}
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Remove holiday</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
