"use client";

import type { Dispatch, SetStateAction } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ExpenseForm } from "@/components/components/checking-account/expense-form";

type AddExpenseDialogProps = {
  open: boolean;
  onOpenChange: Dispatch<SetStateAction<boolean>>;
  token: string;
};

export function AddExpenseDialog({ open, onOpenChange, token }: AddExpenseDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[60%] !max-w-6xl sm:!max-w-6xl h-auto" style={{ transform: 'translateY(-20px)' }}>
        <DialogHeader className="pb-2">
          <DialogTitle>Add Expense</DialogTitle>
          <DialogDescription>Create a manual expense transaction for your checking account.</DialogDescription>
        </DialogHeader>
        <ExpenseForm token={token} onSuccess={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
