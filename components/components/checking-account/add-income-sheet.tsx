"use client";

import type { Dispatch, SetStateAction } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { IncomeForm } from "@/components/components/checking-account/income-form";

type AddIncomeDialogProps = {
  open: boolean;
  onOpenChange: Dispatch<SetStateAction<boolean>>;
  token: string;
};

export function AddIncomeDialog({ open, onOpenChange, token }: AddIncomeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[60%] !max-w-6xl sm:!max-w-6xl h-auto" style={{ transform: 'translateY(-20px)' }}>
        <DialogHeader className="pb-2">
          <DialogTitle>Add Income</DialogTitle>
          <DialogDescription>Create a manual income transaction for your checking account.</DialogDescription>
        </DialogHeader>
        <IncomeForm token={token} />
      </DialogContent>
    </Dialog>
  );
}
