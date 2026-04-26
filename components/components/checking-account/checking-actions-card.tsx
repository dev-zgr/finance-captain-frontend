"use client";

import { BanknoteArrowDown, BanknoteArrowUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type CheckingActionsCardProps = {
  onAddExpense: () => void;
};

export function CheckingActionsCard({ onAddExpense }: CheckingActionsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button type="button" variant="outline" className="w-full justify-between" disabled>
          <span>Add Income</span>
          <BanknoteArrowUp className="size-4 text-emerald-500" />
        </Button>
        <Button variant="secondary" size="lg" className="w-full justify-between " onClick={onAddExpense} data-icon="inline-end">
          Add Expense
          <BanknoteArrowDown className="size-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
