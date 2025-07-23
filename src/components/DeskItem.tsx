"use client";

import { Armchair } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Booking } from "@/types";
import { Avatar, AvatarFallback } from "./ui/avatar";

type DeskItemProps = {
  deskId: string;
  booking: Booking | undefined;
  isBookedByMe: boolean;
  onBookDesk: (deskId: string) => void;
  isSelectedDate: boolean;
};

export default function DeskItem({
  deskId,
  booking,
  isBookedByMe,
  onBookDesk,
  isSelectedDate,
}: DeskItemProps) {
  const deskNumber = deskId.split(".").pop();
  const isButtonDisabled = false;

  const getTooltipContent = () => {
    if (booking) {
      return `Booked by: ${booking.userName}`;
    }
    if (!isSelectedDate) {
      return "Select a date to book";
    }
    return `Book desk ${deskNumber}`;
  };
  
  const getInitials = (name: string) => {
    if (!name) return "";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const variant = isBookedByMe ? "default" : booking ? "secondary" : "outline";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            size="icon"
            className={cn(
              "h-14 w-full flex-col gap-1 transition-all duration-200",
              isBookedByMe &&
                "bg-primary text-primary-foreground hover:bg-primary/90",
              booking &&
                !isBookedByMe &&
                "bg-muted text-muted-foreground",
              !booking && "hover:bg-accent/20 hover:border-primary"
            )}
            onClick={() => onBookDesk(deskId)}
            disabled={isButtonDisabled}
            aria-label={getTooltipContent()}
          >
            {booking ? (
              <Avatar className="h-6 w-6">
                <AvatarFallback
                  className={cn(
                    "text-xs",
                    isBookedByMe
                      ? "bg-primary-foreground text-primary"
                      : "bg-muted-foreground text-background"
                  )}
                >
                  {getInitials(booking.userName)}
                </AvatarFallback>
              </Avatar>
            ) : (
              <Armchair className="h-6 w-6" />
            )}
            <span className="text-xs font-mono">{deskNumber}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getTooltipContent()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
