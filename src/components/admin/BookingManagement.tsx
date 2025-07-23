
"use client"

import * as React from "react";
import type { Booking } from "@/types";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
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

export function BookingManagement() {
  const [bookings, setBookings] = React.useState<Booking[]>([]);
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

  const sortedBookings = React.useMemo(() => {
      return [...bookings].sort((a,b) => b.date.getTime() - a.date.getTime())
  }, [bookings])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Booking Management</CardTitle>
        <CardDescription>View and cancel all desk bookings.</CardDescription>
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
            {sortedBookings.length > 0 ? sortedBookings.map((booking) => (
              <TableRow key={booking.id}>
                <TableCell>{booking.userName}</TableCell>
                <TableCell>{booking.deskId}</TableCell>
                <TableCell>{format(booking.date, "PPP")}</TableCell>
                <TableCell className="text-right">
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm"><X className="h-4 w-4 mr-2"/>Cancel</Button>
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
                    <TableCell colSpan={4} className="text-center h-24">No bookings found.</TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
