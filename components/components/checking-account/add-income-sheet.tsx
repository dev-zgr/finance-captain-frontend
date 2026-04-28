"use client";

import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { IncomeForm } from "@/components/components/checking-account/income-form";

type AddIncomeDialogProps = {
  open: boolean;
  onOpenChange: Dispatch<SetStateAction<boolean>>;
  token: string;
};

const DESCRIPTIONS: Record<string, string> = {
  income: "Create a manual income transaction for your checking account.",
  scan: "Scan your paystub to automatically extract income transaction details.",
};

export function AddIncomeDialog({ open, onOpenChange, token }: AddIncomeDialogProps) {
  const [activeTab, setActiveTab] = useState("income");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[60%] !max-w-6xl sm:!max-w-6xl h-auto" style={{ transform: 'translateY(-20px)' }}>
        <DialogHeader className="pb-2">
          <DialogTitle>Add Income</DialogTitle>
          <DialogDescription>{DESCRIPTIONS[activeTab]}</DialogDescription>
        </DialogHeader>
        <IncomeForm token={token} onTabChange={setActiveTab} />
      </DialogContent>
    </Dialog>
  );
}
