"use client"

import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowUpToLine,
  Landmark,
  Wallet,
} from "lucide-react"
import type { ReactNode } from "react"

import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { cn } from "@/lib/utils"

type LinkedTransferDirection =
  | "CHECKING_TO_INVESTMENT"
  | "INVESTMENT_TO_CHECKING"

type LinkedTransferStepProps = {
  direction: LinkedTransferDirection
  amount: number
  checkingBalance: number
  investmentBalance: number
  errorMessage?: string
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value)

function TransferItem({
  title,
  currentBalance,
  previewBalance,
  isInvalid,
  description,
  accountIcon,
  actionIcon,
  actionClassName,
}: {
  title: string
  currentBalance: number
  previewBalance: number
  isInvalid?: boolean
  description: string
  accountIcon: ReactNode
  actionIcon: ReactNode
  actionClassName: string
}) {
  return (
    <Item
      variant="outline"
      className={cn(isInvalid && "border-red-500/50 bg-red-500/5")}
    >
      <ItemMedia variant="icon" className="text-primary">
        {accountIcon}
      </ItemMedia>
      <ItemContent>
        <ItemTitle>{title}</ItemTitle>
        <ItemDescription>
          Current balance: {formatCurrency(currentBalance)}
        </ItemDescription>
        <ItemDescription
          className={cn("text-xs", isInvalid && "text-red-600")}
        >
          After transfer: {formatCurrency(previewBalance)}
        </ItemDescription>
        <ItemDescription className="text-xs text-muted-foreground">
          {description}
        </ItemDescription>
      </ItemContent>
      <ItemActions className={actionClassName}>{actionIcon}</ItemActions>
    </Item>
  )
}

export function LinkedTransferStep({
  direction,
  amount,
  checkingBalance,
  investmentBalance,
  errorMessage,
}: LinkedTransferStepProps) {
  const isDeposit = direction === "CHECKING_TO_INVESTMENT"
  const checkingPreview = isDeposit
    ? checkingBalance - amount
    : checkingBalance + amount
  const investmentPreview = isDeposit
    ? investmentBalance + amount
    : investmentBalance - amount
  const invalidChecking = isDeposit && checkingPreview < 0
  const invalidInvestment = !isDeposit && investmentPreview < 0

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <TransferItem
          title="Checking"
          currentBalance={checkingBalance}
          previewBalance={checkingPreview}
          isInvalid={invalidChecking}
          description={
            isDeposit
              ? "Amount will be deducted from this account."
              : "Amount will be credited to this account."
          }
          accountIcon={<Wallet className="size-5" />}
          actionIcon={
            isDeposit ? (
              <ArrowUpFromLine className="size-5" />
            ) : (
              <ArrowDownToLine className="size-5" />
            )
          }
          actionClassName={isDeposit ? "text-red-700" : "text-green-700"}
        />
        <TransferItem
          title="Investment"
          currentBalance={investmentBalance}
          previewBalance={investmentPreview}
          isInvalid={invalidInvestment}
          description={
            isDeposit
              ? "Amount will be credited to this account."
              : "Amount will be deducted from this account."
          }
          accountIcon={<Landmark className="size-5" />}
          actionIcon={
            isDeposit ? (
              <ArrowDownToLine className="size-5" />
            ) : (
              <ArrowUpToLine className="size-5" />
            )
          }
          actionClassName={isDeposit ? "text-green-700" : "text-red-700"}
        />
      </div>

      <p className="text-sm text-muted-foreground">
        {isDeposit
          ? "This will be transferred from your Checking Account to your Investment Account."
          : "This will be transferred from your Investment Account to your Checking Account."}
      </p>

      {errorMessage ? (
        <p className="text-xs text-red-600">{errorMessage}</p>
      ) : null}
    </div>
  )
}

export type { LinkedTransferDirection }
