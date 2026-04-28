"use client";

import { format } from "date-fns";
import { CalendarIcon, X } from "lucide-react";
import type { DateRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type ChartDateRangePickerProps = {
  value?: DateRange;
  onChange: (nextValue: DateRange | undefined) => void;
  clearable?: boolean;
  className?: string;
};

function getDateRangeLabel(value?: DateRange): string {
  if (value?.from && value?.to) {
    return `${format(value.from, "MMM dd, y")} - ${format(value.to, "MMM dd, y")}`;
  }

  if (value?.from) {
    return format(value.from, "MMM dd, y");
  }

  return "Pick a date range";
}

export function ChartDateRangePicker({
  value,
  onChange,
  clearable = true,
  className,
}: ChartDateRangePickerProps) {
  const hasSelection = Boolean(value?.from || value?.to);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const handleClear = (e: React.MouseEvent<SVGSVGElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onChange(undefined);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="default"
          className={cn(
            "w-[280px] justify-start text-left font-normal",
            !hasSelection && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon data-icon="inline-start" />
          <span className="truncate">{getDateRangeLabel(value)}</span>
          {clearable && hasSelection ? (
            <X
              className="ml-auto size-4 text-muted-foreground hover:text-foreground"
              aria-label="Clear date range"
              onClick={handleClear}
            />
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <Calendar mode="range" numberOfMonths={2} selected={value} onSelect={onChange} disabled={{ after: today }} />
      </PopoverContent>
    </Popover>
  );
}
