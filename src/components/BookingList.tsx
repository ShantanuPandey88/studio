
"use client";

import { format } from "date-fns";
import { X } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import type { Booking } from "@/types";
import { Badge } from "./ui/badge";

type BookingListProps = {
  bookings: Booking[];
  onCancelBooking: (booking: Booking) => void;
};

export default function BookingList({
  bookings,
  onCancelBooking,
}: BookingListProps) {
  if (bookings.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        You have no upcoming bookings.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Desk</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.map((booking) => (
            <TableRow key={booking.id}>
              <TableCell>
                <Badge variant="secondary">{booking.deskId.split('.').pop()}</Badge>
              </TableCell>
              <TableCell>{format(booking.date, "dd/MM/yy")}</TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onCancelBooking(booking)}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Cancel booking</span>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
