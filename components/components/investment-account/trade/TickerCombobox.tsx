"use client"

import { useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { NASDAQ_100 } from "@/lib/investment-account/nasdaq100"

type TickerComboboxProps = {
  value: string
  onSelect: (ticker: string) => void
  placeholder?: string
  disabled?: boolean
  filteredTickers?: string[]
}

export function TickerCombobox({
  value,
  onSelect,
  placeholder = "Select a stock...",
  disabled = false,
  filteredTickers,
}: TickerComboboxProps) {
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState("")

  const availableTickers = filteredTickers
    ? NASDAQ_100.filter((stock) => filteredTickers.includes(stock.ticker))
    : NASDAQ_100

  const selectedStock = NASDAQ_100.find((stock) => stock.ticker === value)

  const filteredStocks = availableTickers.filter((stock) =>
    `${stock.ticker} ${stock.name}`.toLowerCase().includes(searchValue.toLowerCase())
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          <span className="truncate">
            {selectedStock ? (
              <span>
                <span className="font-semibold">{selectedStock.ticker}</span>
                <span className="ml-2 text-muted-foreground">{selectedStock.name}</span>
              </span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput
            placeholder="Search ticker or company..."
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            <CommandEmpty>No stocks found.</CommandEmpty>
            <CommandGroup>
              {filteredStocks.map((stock: { ticker: string; name: string }) => (
                <CommandItem
                  key={stock.ticker}
                  value={stock.ticker}
                  onSelect={(currentValue: string) => {
                    onSelect(currentValue === value ? "" : currentValue)
                    setOpen(false)
                    setSearchValue("")
                  }}
                >
                  <Check
                    className={cn("mr-2 h-4 w-4", value === stock.ticker ? "opacity-100" : "opacity-0")}
                  />
                  <span className="font-semibold">{stock.ticker}</span>
                  <span className="ml-2 text-sm text-muted-foreground">{stock.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
