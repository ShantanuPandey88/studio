
"use client";

import * as React from "react";
import { addDays, isSameDay, isWeekend, startOfToday, startOfDay } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Holiday } from "@/types";

type CalendarViewProps = {
  selectedDate: Date | undefined;
  onDateSelect: (date: Date | undefined) => void;
  bookedDates?: Date[];
  holidays: Holiday[];
};

export default function CalendarView({
  selectedDate,
  onDateSelect,
  bookedDates,
  holidays,
}: CalendarViewProps) {
  const today = startOfToday();

  const isPublicHoliday = (date: Date) => {
      const normalizedDate = startOfDay(date);
      return holidays.some(
          (holiday) => holiday.date.getTime() === normalizedDate.getTime()
      );
  };

  const getPublicHolidayName = (date: Date) => {
    const normalizedDate = startOfDay(date);
    return holidays.find(
      (holiday) => holiday.date.getTime() === normalizedDate.getTime()
    )?.name;
  };

  const isDateBooked = (date: Date) => {
    return bookedDates?.some(d => isSameDay(d, date)) ?? false;
  }
  
  const lastBookableDate = React.useMemo(() => {
    let workingDaysFound = 0;
    let currentDate = today;
    
    // Check if today is a working day
    if (!isWeekend(currentDate) && !isPublicHoliday(currentDate)) {
        // Today counts as one of the bookable days but we need to find 2 days *in advance*
        // So we start counting from the next day.
    }
    
    // We need to find 2 future working days.
    // So we iterate and find the date of the 2nd working day from today.
    while (workingDaysFound < 2) {
      currentDate = addDays(currentDate, 1);
      if (!isWeekend(currentDate) && !isPublicHoliday(currentDate)) {
        workingDaysFound++;
      }
    }
    return currentDate;
  }, [today, holidays, isPublicHoliday]);


  const isDateDisabled = (date: Date) => {
    const isPastDate = date < today;
    if (isPastDate && isDateBooked(date)) {
        return false; // Don't disable past dates that are booked
    }

    return (
      isPublicHoliday(date) ||
      isWeekend(date) ||
      date < today ||
      date > lastBookableDate
    );
  };

  return (
    <TooltipProvider>
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={onDateSelect}
        disabled={isDateDisabled}
        className="rounded-md border"
        modifiers={{ 
          booked: bookedDates || [],
          holiday: (date) => isPublicHoliday(date)
        }}
        modifiersClassNames={{
          booked: "border border-primary rounded-md",
          holiday: "day-holiday",
        }}
        components={{
          DayContent: (props) => {
            const holidayName = getPublicHolidayName(props.date);
            if (holidayName) {
              return (
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <div className="w-full h-full flex items-center justify-center">
                      {props.date.getDate()}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{holidayName.toUpperCase()}</p>
                  </TooltipContent>
                </Tooltip>
              );
            }
            return <>{props.date.getDate()}</>;
          },
        }}
        fromYear={today.getFullYear() -1}
        toYear={today.getFullYear() +1}
      />
    </TooltipProvider>
  );
}
