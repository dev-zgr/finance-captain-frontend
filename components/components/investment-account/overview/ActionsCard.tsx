"use client"

import { BanknoteArrowDown, BanknoteArrowUp } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type ActionsCardProps = {
  onDepositFunds: () => void
  onWithdrawFunds: () => void
}

export function ActionsCard({
  onDepositFunds,
  onWithdrawFunds,
}: ActionsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Actions</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <Button
          variant="outline"
          size="lg"
          type="button"
          className="w-full justify-between"
          onClick={onDepositFunds}
          data-icon="inline-end"
        >
          Deposit Funds
          <BanknoteArrowDown />
        </Button>
        <Button
          variant="outline"
          size="lg"
          type="button"
          className="w-full justify-between"
          onClick={onWithdrawFunds}
          data-icon="inline-end"
        >
          Withdraw Funds
          <BanknoteArrowUp />
        </Button>
      </CardContent>
    </Card>
  )
}
