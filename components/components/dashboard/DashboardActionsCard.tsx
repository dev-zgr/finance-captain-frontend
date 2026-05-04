"use client";

import Link from "next/link";
import {
  BanknoteArrowDown,
  BanknoteArrowUp,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type Props = {
  onAddIncome: () => void;
  onAddExpense: () => void;
  onGetDebt: () => void;
  onPayDebt: () => void;
  onDeposit: () => void;
  onWithdraw: () => void;
};

const SECTION_LABEL =
  "text-xs font-semibold uppercase tracking-wider text-muted-foreground";

export function DashboardActionsCard({
  onAddIncome,
  onAddExpense,
  onGetDebt,
  onPayDebt,
  onDeposit,
  onWithdraw,
}: Props) {
  return (
    <Card className="col-span-12">
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>
          Add income, manage debts, and move money in or out of investments.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch">
          <section className="flex flex-1 flex-col gap-3">
            <p className={SECTION_LABEL}>Checking</p>
            <Button
              variant="outline"
              size="lg"
              type="button"
              className="w-full justify-between"
              onClick={onAddIncome}
              data-icon="inline-end"
            >
              Add Income
              <BanknoteArrowUp className="size-4 text-green-700" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              type="button"
              className="w-full justify-between"
              onClick={onAddExpense}
              data-icon="inline-end"
            >
              Add Expense
              <BanknoteArrowDown className="size-4 text-red-700" />
            </Button>
          </section>

          <Separator orientation="vertical" className="hidden lg:block" />
          <Separator orientation="horizontal" className="lg:hidden" />

          <section className="flex flex-1 flex-col gap-3">
            <p className={SECTION_LABEL}>Debts</p>
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
          </section>

          <Separator orientation="vertical" className="hidden lg:block" />
          <Separator orientation="horizontal" className="lg:hidden" />

          <section className="flex flex-1 flex-col gap-3">
            <p className={SECTION_LABEL}>Investments</p>
            <div className="flex flex-col gap-3 lg:max-h-[84px] lg:overflow-y-auto lg:pr-1">
              <Button
                variant="outline"
                size="lg"
                type="button"
                className="w-full justify-between"
                onClick={onDeposit}
                data-icon="inline-end"
              >
                Deposit Funds
                <BanknoteArrowDown className="size-4 text-green-700" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                type="button"
                className="w-full justify-between"
                onClick={onWithdraw}
                data-icon="inline-end"
              >
                Withdraw Funds
                <BanknoteArrowUp className="size-4 text-red-700" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                asChild
                className="w-full justify-between"
                data-icon="inline-end"
              >
                <Link href="/investment-account/trade">
                  Buy
                  <TrendingUp className="size-4 text-green-700" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                asChild
                className="w-full justify-between"
                data-icon="inline-end"
              >
                <Link href="/investment-account/trade">
                  Sell
                  <TrendingDown className="size-4 text-red-700" />
                </Link>
              </Button>
            </div>
          </section>
        </div>
      </CardContent>
    </Card>
  );
}
