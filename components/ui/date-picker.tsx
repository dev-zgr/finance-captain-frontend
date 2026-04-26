"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type DatePickerProps = {
  value: string;
  onChange: (dateString: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  placeholder?: string;
};

export function DatePicker({
  value,
  onChange,
  onBlur,
  disabled = false,
  placeholder = "Pick a date",
}: DatePickerProps) {
  const date = value ? new Date(value) : undefined;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [open, setOpen] = React.useState(false);

  const handleSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      onChange(format(selectedDate, "yyyy-MM-dd"));
      setOpen(false);
    }
  };

  const isDateDisabled = (date: Date) => {
    const dateToCheck = new Date(date);
    dateToCheck.setHours(0, 0, 0, 0);
    return dateToCheck > today;
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    // Call onBlur when popover closes
    if (!newOpen && onBlur) {
      onBlur();
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="lg"
          disabled={disabled}
          data-empty={!date}
          className="w-full justify-start text-left font-normal data-[empty=true]:text-muted-foreground"
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "MMM dd, yyyy") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={date} onSelect={handleSelect} disabled={isDateDisabled} />
      </PopoverContent>
    </Popover>
  );
}
