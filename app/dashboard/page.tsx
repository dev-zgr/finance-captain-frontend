"use client";

import { useState } from "react";
import { useSelector } from "react-redux";

import { AddExpenseDialog } from "@/components/components/checking-account/add-expense-sheet";
import { AddIncomeDialog } from "@/components/components/checking-account/add-income-sheet";
import { DashboardActionsCard } from "@/components/components/dashboard/DashboardActionsCard";
import { DashboardChartsCard } from "@/components/components/dashboard/DashboardChartsCard";
import { DashboardRecentTransactionsTable } from "@/components/components/dashboard/DashboardRecentTransactionsTable";
import { DashboardSummarySlider } from "@/components/components/dashboard/DashboardSummarySlider";
import { GetDebtDialog } from "@/components/components/debts-account/get-debt-dialog";
import { PayDebtDialog } from "@/components/components/debts-account/pay-debt-dialog";
import { InvestmentPositionsPreviewCard } from "@/components/components/investment-account/overview/investment-positions-preview-card";
import { OverviewAiNewsCard } from "@/components/components/investment-account/overview/overview-ai-news-card";
import { DepositFundsDialog } from "@/components/components/investment-account/transactions/DepositFundsDialog";
import { WithdrawFundsDialog } from "@/components/components/investment-account/transactions/WithdrawFundsDialog";
import { AuthenticatedDashboardLayout } from "@/components/dashboard/AuthenticatedDashboardLayout";
import type { RootState } from "@/lib/store";

export default function DashboardPage() {
  const { content } = useSelector((state: RootState) => state.auth);
  const firstName = content?.user?.firstName ?? "Captain";
  const token = content?.token ?? "";

  const [summaryRefreshKey, setSummaryRefreshKey] = useState(0);
  const handleSuccess = () =>
    setSummaryRefreshKey((current) => current + 1);

  const [addIncomeOpen, setAddIncomeOpen] = useState(false);
  const [addExpenseOpen, setAddExpenseOpen] = useState(false);
  const [getDebtOpen, setGetDebtOpen] = useState(false);
  const [payDebtOpen, setPayDebtOpen] = useState(false);
  const [depositOpen, setDepositOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  return (
    <AuthenticatedDashboardLayout>
      <section className="flex flex-col gap-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome back, {firstName}
        </h1>
        <div className="grid grid-cols-12 gap-6">
          <DashboardChartsCard token={token} />
          <DashboardSummarySlider
            token={token}
            refreshKey={summaryRefreshKey}
          />
          <DashboardActionsCard
            onAddIncome={() => setAddIncomeOpen(true)}
            onAddExpense={() => setAddExpenseOpen(true)}
            onGetDebt={() => setGetDebtOpen(true)}
            onPayDebt={() => setPayDebtOpen(true)}
            onDeposit={() => setDepositOpen(true)}
            onWithdraw={() => setWithdrawOpen(true)}
          />
          <InvestmentPositionsPreviewCard />
          <OverviewAiNewsCard />
          <DashboardRecentTransactionsTable refreshKey={summaryRefreshKey} />
        </div>
      </section>

      <AddIncomeDialog
        open={addIncomeOpen}
        onOpenChange={setAddIncomeOpen}
        token={token}
        onSuccess={handleSuccess}
      />
      <AddExpenseDialog
        open={addExpenseOpen}
        onOpenChange={setAddExpenseOpen}
        token={token}
        onSuccess={handleSuccess}
      />
      <GetDebtDialog
        open={getDebtOpen}
        onOpenChange={setGetDebtOpen}
        token={token}
        onSuccess={handleSuccess}
      />
      <PayDebtDialog
        open={payDebtOpen}
        onOpenChange={setPayDebtOpen}
        token={token}
        onSuccess={handleSuccess}
      />
      <DepositFundsDialog
        open={depositOpen}
        onOpenChange={setDepositOpen}
        token={token}
        onSuccess={handleSuccess}
      />
      <WithdrawFundsDialog
        open={withdrawOpen}
        onOpenChange={setWithdrawOpen}
        token={token}
        onSuccess={handleSuccess}
      />
    </AuthenticatedDashboardLayout>
  );
}
