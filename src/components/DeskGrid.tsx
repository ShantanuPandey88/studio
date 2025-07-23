
"use client";

import { isSameDay } from "date-fns";
import type { Booking, Desk } from "@/types";
import DeskItem from "./DeskItem";
import type { User as AuthUser } from "firebase/auth";

type DeskGridProps = {
  desks: Desk[];
  bookings: Booking[];
  onBookDesk: (deskId: string) => void;
  currentUser: Pick<AuthUser, 'uid' | 'displayName'>;
};

export default function DeskGrid({
  desks,
  bookings,
  onBookDesk,
  currentUser,
}: DeskGridProps) {
  return (
    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
      {desks.map((desk) => {
        const booking = bookings.find(
          (b) => b.deskId === desk.id
        );

        const isBookedByMe = booking?.userId === currentUser.uid;

        return (
          <DeskItem
            key={desk.id}
            deskId={desk.id}
            booking={booking}
            isBookedByMe={isBookedByMe}
            onBookDesk={onBookDesk}
            isSelectedDate={true}
          />
        );
      })}
    </div>
  );
}

    