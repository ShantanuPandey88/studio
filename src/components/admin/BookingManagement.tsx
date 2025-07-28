
"use client"

import * as React from "react";
import type { Booking } from "@/types";
import { format, startOfToday, isSameDay } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { getBookings, deleteBooking, Unsubscribe } from "@/lib/firestore-adapter";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useAuth } from "@/context/AuthContext";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import { cn } from "@/lib/utils";

export function BookingManagement() {
  const [bookings, setBookings] = React.useState<Booking[]>([]);
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>();
  const { toast } = useToast();
  const { user, db } = useAuth();

  React.useEffect(() => {
    if (!user || !db) return; // Wait for user to be authenticated

    const unsubscribe = getBookings(db, setBookings);
    return () => unsubscribe();
  }, [user, db]);

  const handleCancelBooking = async (bookingId: string) => {
    try {
        await deleteBooking(db, bookingId);
        toast({
        title: "Booking Cancelled",
        description: `The booking has been successfully cancelled.`,
        });
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to cancel the booking."
        })
        console.error("Error cancelling booking: ", error);
    }
  };

  const filteredAndSortedBookings = React.useMemo(() => {
      const today = startOfToday();
      const filtered = bookings.filter(booking => {
          if (selectedDate) {
              return isSameDay(booking.date, selectedDate);
          }
          return booking.date >= today;
      });

      return filtered.sort((a,b) => b.date.getTime() - a.date.getTime())
  }, [bookings, selectedDate]);
  
  const isDateInPast = (date: Date) => {
    return date < startOfToday();
  }

  return (
    <Card>
      <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
            <CardTitle>Booking Management</CardTitle>
            <CardDescription>
                {selectedDate 
                    ? `Showing bookings for ${format(selectedDate, "PPP")}.`
                    : "Showing current and upcoming bookings."
                }
            </CardDescription>
        </div>
        <div className="flex items-center gap-2 mt-4 md:mt-0">
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                    variant={"outline"}
                    className={cn(
                        "w-[240px] justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                    )}
                    >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : <span>Filter by date...</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    initialFocus
                    />
                </PopoverContent>
            </Popover>
            {selectedDate && (
                <Button variant="ghost" onClick={() => setSelectedDate(undefined)}>Clear</Button>
            )}
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Desk ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedBookings.length > 0 ? filteredAndSortedBookings.map((booking) => (
              <TableRow key={booking.id}>
                <TableCell>{booking.userName}</TableCell>
                <TableCell>{booking.deskId}</TableCell>
                <TableCell>{format(booking.date, "PPP")}</TableCell>
                <TableCell className="text-right">
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm" disabled={isDateInPast(booking.date)}>
                                <X className="h-4 w-4 mr-2"/>Cancel
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently cancel the booking for {booking.userName} on {format(booking.date, "PPP")}.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Back</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleCancelBooking(booking.id)}>Confirm Cancellation</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </TableCell>
              </TableRow>
            )) : (
                 <TableRow>
                    <TableCell colSpan={4} className="text-center h-24">No bookings found for the selected criteria.</TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
