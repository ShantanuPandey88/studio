
"use client";

import * as React from "react";
import { addDays, isSameDay, format, startOfDay, isWeekend } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Booking, Holiday, Desk } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { 
    getBookings, 
    addBooking, 
    deleteBooking, 
    getHolidays, 
    getDesks,
    getUsers, 
    Unsubscribe
} from "@/lib/firestore-adapter";


import CalendarView from "@/components/CalendarView";
import DeskGrid from "@/components/DeskGrid";
import BookingList from "@/components/BookingList";
import Header from "@/components/Header";
import AiBookingDialog from "@/components/AiBookingDialog";
import FloorplanModal from "@/components/FloorplanModal";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import BookingConfirmationDialog from "@/components/BookingConfirmationDialog";
import ProtectedRoute from "@/components/ProtectedRoute";
import type { User } from "@/lib/firebase";
import ProfileDialog from "@/components/ProfileDialog";

export default function HomePage() {
  const { user, db } = useAuth();
  
  const [employees, setEmployees] = React.useState<User[]>([]);
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(new Date());
  const [bookings, setBookings] = React.useState<Booking[]>([]);
  const [holidays, setHolidays] = React.useState<Holiday[]>([]);
  const [desks, setDesks] = React.useState<Desk[]>([]);

  const [isAiModalOpen, setAiModalOpen] = React.useState(false);
  const [isFloorplanModalOpen, setFloorplanModalOpen] = React.useState(false);
  const [isProfileModalOpen, setProfileModalOpen] = React.useState(false);
  const [bookingToConfirm, setBookingToConfirm] = React.useState<string | null>(null);
  const { toast } = useToast();

  React.useEffect(() => {
    if (!user || !db) return; // Wait until user and db are authenticated

    let unsubBookings: Unsubscribe | undefined;
    let unsubHolidays: Unsubscribe | undefined;
    let unsubDesks: Unsubscribe | undefined;
    
    // Only set up listeners if the user is authenticated
    unsubBookings = getBookings(db, setBookings);
    unsubHolidays = getHolidays(db, setHolidays);
    unsubDesks = getDesks(db, setDesks, (err) => console.error(err));
    
    getUsers(db).then(allUsers => {
        setEmployees(allUsers.filter(u => u.role !== 'admin' && !u.disabled));
    });

    return () => {
        unsubBookings?.();
        unsubHolidays?.();
        unsubDesks?.();
    }
  }, [user, db]); // Add user and db as a dependency
  
  const userBookings = React.useMemo(() => {
    if (!user) return [];
    return bookings
      .filter(b => b.userId === user.uid)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [bookings, user]);

  const userBookingDates = React.useMemo(() => 
    userBookings.map(b => b.date),
    [userBookings]
  );

  const dailyBookings = React.useMemo(() => {
    if (!selectedDate) return [];
    return bookings.filter(b => isSameDay(b.date, selectedDate))
      .sort((a,b) => a.userName.localeCompare(b.userName));
  }, [bookings, selectedDate]);

  const handleBookDesk = (deskId: string) => {
    if (!selectedDate) {
      toast({
        variant: "destructive",
        title: "No Date Selected",
        description: "Please select a date first.",
      });
      return;
    }
    if (!user) {
        toast({ variant: "destructive", title: "Not Authenticated" });
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

    const now = new Date();
    if (isSameDay(selectedDate, now)) {
      // Check if current time is past 2 PM IST
      const istOffset = 5.5 * 60 * 60 * 1000;
      const nowUtc = now.getTime() + (now.getTimezoneOffset() * 60 * 1000);
      const nowIst = new Date(nowUtc + istOffset);
      const hoursIst = nowIst.getUTCHours();
      if (hoursIst >= 14) {
          toast({
              variant: "destructive",
              title: "Booking Closed for Today",
              description: "Same-day bookings are only allowed until 2 PM IST.",
          });
          return;
      }
    }

    const userHasBookingOnDate = bookings.some(
      (b) => isSameDay(b.date, selectedDate) && b.userId === user.uid
    );

    if (userHasBookingOnDate) {
      toast({
        variant: "destructive",
        title: "Booking Limit Reached",
        description: "You can only book one desk per day.",
      });
      return;
    }

    const isDeskAlreadyBooked = bookings.some(
      (b) => isSameDay(b.date, selectedDate) && b.deskId === deskId
    );
    if (isDeskAlreadyBooked) {
      toast({
        variant: "destructive",
        title: "Desk Unavailable",
        description: "This desk is already booked on this date.",
      });
      return;
    }
    
    setBookingToConfirm(deskId);
  };

  const confirmBooking = async (deskId: string) => {
    if (!selectedDate || !user) return;

    try {
        await addBooking(db, {
            deskId,
            date: startOfDay(selectedDate),
            userId: user.uid,
            userName: user.displayName || user.email!,
        });
        toast({
            title: "Desk Booked!",
            description: `Desk ${deskId.split(".").pop()} has been booked for you.`,
        });
    } catch (error) {
        console.error("Error booking desk: ", error);
        toast({
            variant: "destructive",
            title: "Booking Failed",
            description: "Could not book the desk. Please try again.",
        });
    } finally {
        setBookingToConfirm(null);
    }
  };
  
  const handleAiBookDesk = async (deskId: string, employeeId: string) => {
    if (!selectedDate) {
      return;
    }

    const employee = employees.find(u => u.uid === employeeId);
    if (!employee) {
        toast({
            variant: "destructive",
            title: "Employee not found",
            description: "Could not find an employee with that ID.",
        });
        return;
    }
    
    const employeeHasBookingOnDate = bookings.some(
      (b) => isSameDay(b.date, selectedDate) && b.userId === employee.uid
    );

    if (employeeHasBookingOnDate) {
      toast({
        variant: "destructive",
        title: "Booking Limit Reached",
        description: `${employee.displayName} already has a booking for this day.`,
      });
      return;
    }

     try {
        await addBooking(db, {
            deskId,
            date: startOfDay(selectedDate),
            userId: employee.uid,
            userName: employee.displayName,
        });
        setAiModalOpen(false);
        toast({
        title: "Desk Booked!",
        description: `Desk ${deskId.split('.').pop()} booked for ${employee.displayName}.`,
        });
    } catch(error) {
         console.error("Error booking desk via AI: ", error);
        toast({
            variant: "destructive",
            title: "Booking Failed",
            description: "Could not book the desk. Please try again.",
        });
    }
  }

  const handleCancelBooking = async (bookingToCancel: Booking) => {
    if (!bookingToCancel) return;

    const now = new Date();
    if (isSameDay(bookingToCancel.date, now)) {
      const istOffset = 5.5 * 60 * 60 * 1000;
      const nowUtc = now.getTime() + (now.getTimezoneOffset() * 60 * 1000);
      const nowIst = new Date(nowUtc + istOffset);
      const hoursIst = nowIst.getUTCHours();
      if (hoursIst >= 14) {
          toast({
              variant: "destructive",
              title: "Cancellation Closed for Today",
              description: "Same-day cancellations are only allowed until 2 PM IST.",
          });
          return;
      }
    }
    
    try {
        await deleteBooking(db, bookingToCancel.id);
        toast({
            title: "Booking Cancelled",
            description: `Your booking for desk ${bookingToCancel.deskId.split('.').pop()} has been cancelled.`,
        });
    } catch (error) {
        console.error("Error cancelling booking: ", error);
        toast({
            variant: "destructive",
            title: "Cancellation Failed",
            description: "Could not cancel the booking. Please try again.",
        });
    }
  };

  return (
    <ProtectedRoute>
    <div className="flex flex-col min-h-screen bg-background">
      <Header
        onOpenFloorplan={() => setFloorplanModalOpen(true)}
        onOpenAiBooking={() => setAiModalOpen(true)}
        onOpenProfile={() => setProfileModalOpen(true)}
      />
      
      <div className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-8 py-8">
          <aside className="w-full md:w-[340px] flex-shrink-0 space-y-8">
            <Card className="shadow-lg rounded-xl">
              <CardHeader>
                <CardTitle className="font-headline text-2xl">Select a Date</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                <CalendarView
                  selectedDate={selectedDate}
                  onDateSelect={setSelectedDate}
                  bookedDates={userBookingDates}
                  holidays={holidays}
                />
              </CardContent>
            </Card>

            <Card className="shadow-lg rounded-xl">
               <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
                <AccordionItem value="item-1" className="border-b-0">
                  <AccordionTrigger className="p-6 hover:no-underline">
                     <h2 className="font-headline text-2xl">My Upcoming Bookings</h2>
                  </AccordionTrigger>
                  <AccordionContent className="p-6 pt-0">
                    <BookingList bookings={userBookings} onCancelBooking={handleCancelBooking} />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </Card>

          </aside>

          <main className="flex-grow">
            <Card className="shadow-lg rounded-xl h-full">
              <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="font-headline text-2xl">Available Desks</CardTitle>
                        <p className="text-muted-foreground">For {selectedDate ? format(selectedDate, "PPP") : "Today"}</p>
                    </div>
                    <div className="text-muted-foreground font-mono bg-muted px-3 py-1 rounded-md text-sm">
                        6.W.WS
                    </div>
                </div>
              </CardHeader>
              <CardContent>
                <DeskGrid
                  desks={desks}
                  bookings={dailyBookings}
                  onBookDesk={handleBookDesk}
                  currentUser={user}
                />
              </CardContent>
            </Card>
          </main>
        </div>
      </div>

      <FloorplanModal isOpen={isFloorplanModalOpen} onOpenChange={setFloorplanModalOpen} />
      <AiBookingDialog 
        isOpen={isAiModalOpen} 
        onOpenChange={setAiModalOpen}
        selectedDate={selectedDate}
        employees={employees}
        onBookDesk={handleAiBookDesk}
        bookings={bookings}
      />
      <BookingConfirmationDialog
        isOpen={!!bookingToConfirm}
        onOpenChange={() => setBookingToConfirm(null)}
        onConfirm={() => bookingToConfirm && confirmBooking(bookingToConfirm)}
        deskId={bookingToConfirm}
      />
      <ProfileDialog
        isOpen={isProfileModalOpen}
        onOpenChange={setProfileModalOpen}
      />
    </div>
    </ProtectedRoute>
  );
}
