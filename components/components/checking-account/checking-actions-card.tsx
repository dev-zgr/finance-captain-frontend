"use client";

import { BanknoteArrowDown, BanknoteArrowUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type CheckingActionsCardProps = {
  onAddExpense: () => void;
  onAddIncome: () => void;
};

export function CheckingActionsCard({ onAddExpense, onAddIncome }: CheckingActionsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button variant="outline" size="lg" type="button" className="w-full justify-between" onClick={onAddIncome}>
          <span>Add Income</span>
          <BanknoteArrowUp className="size-4 text-green-700" />
        </Button>
        <Button variant="outline" size="lg" className="w-full justify-between " onClick={onAddExpense} data-icon="inline-end">
          Add Expense
          <BanknoteArrowDown className="size-4 text-red-700"  />
        </Button>
      </CardContent>
    </Card>
  );
}
