"use client";

import React, { useState } from "react";
import { useSelector } from "react-redux";

import { AuthenticatedDashboardLayout } from "@/components/dashboard/AuthenticatedDashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckingActionsCard } from "@/components/components/checking-account/checking-actions-card";
import { AddExpenseDialog } from "@/components/components/checking-account/add-expense-sheet";
import { AddIncomeDialog } from "@/components/components/checking-account/add-income-sheet";
import type { RootState } from "@/lib/store";

export default function CheckingPage() {
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [incomeDialogOpen, setIncomeDialogOpen] = useState(false);
  const token = useSelector((state: RootState) => state.auth.content?.token ?? "");

  return (
    <AuthenticatedDashboardLayout>
      <section className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">Checking Account</h1>

        <div className="grid gap-4 lg:grid-cols-[13fr_7fr]">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Chart</CardTitle>
              <CardDescription>Primary checking account visualization area.</CardDescription>
            </CardHeader>
            <CardContent className="min-h-56" />
          </Card>

          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Card 1</CardTitle>
                <CardDescription>Top right placeholder.</CardDescription>
              </CardHeader>
              <CardContent className="min-h-24" />
            </Card>

            <CheckingActionsCard 
              onAddExpense={() => setExpenseDialogOpen(true)}
              onAddIncome={() => setIncomeDialogOpen(true)}
            />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Bottom Full Width</CardTitle>
            <CardDescription>Bottom section placeholder.</CardDescription>
          </CardHeader>
          <CardContent className="min-h-40" />
        </Card>
      </section>

      <AddExpenseDialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen} token={token} />
      <AddIncomeDialog open={incomeDialogOpen} onOpenChange={setIncomeDialogOpen} token={token} />
    </AuthenticatedDashboardLayout>
  );
}
