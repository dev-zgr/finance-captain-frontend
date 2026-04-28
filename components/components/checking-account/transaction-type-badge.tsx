import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { resolveTransactionType } from "@/lib/checking-account/transaction-presentation";
import type { TransactionType } from "@/lib/checking-account/types";
import { Badge } from "@/components/ui/badge";

type TransactionTypeBadgeProps = {
  category: string;
  transactionType?: TransactionType;
};

export function TransactionTypeBadge({ category, transactionType }: TransactionTypeBadgeProps) {
  const type = resolveTransactionType(transactionType, category);

  return type === "INCOME" ? (
    <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10">
      Income
      <ArrowUpRight data-icon="inline-end" />
    </Badge>
  ) : (
    <Badge variant="outline" className="border-red-500/30 bg-red-500/10 text-red-700 hover:bg-red-500/10">
      Expense
      <ArrowDownRight data-icon="inline-end" />
    </Badge>
  );
}
