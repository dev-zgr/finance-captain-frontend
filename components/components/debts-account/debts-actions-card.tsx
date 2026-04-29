"use client"

import { BanknoteArrowDown, BanknoteArrowUp } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type DebtsActionsCardProps = {
  onGetDebt: () => void
  onPayDebt: () => void
}

export function DebtsActionsCard({
  onGetDebt,
  onPayDebt,
}: DebtsActionsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          variant="outline"
          size="lg"
          type="button"
          className="w-full justify-between"
          onClick={onGetDebt}
          data-icon="inline-end"
        >
          Get Debt
          <BanknoteArrowDown className="size-4 text-red-700" />
        </Button>
        <Button
          variant="outline"
          size="lg"
          type="button"
          className="w-full justify-between"
          onClick={onPayDebt}
          data-icon="inline-end"
        >
          Pay Debt
          <BanknoteArrowUp className="size-4 text-green-700" />
        </Button>
      </CardContent>
    </Card>
  )
}
